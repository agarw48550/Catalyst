import { GoogleGenerativeAI } from '@google/generative-ai'
import { config } from '@/config'
import { logApiCall } from '@/lib/logger'

/**
 * Gemini AI Client with multi-key fallback support
 * Falls back to OpenRouter / DeepSeek when all Gemini quotas are exhausted
 */

// Lazy client initialization — reads process.env at call time, not module-load time
// Do NOT cache across invocations in serverless — env vars can differ between cold starts
function getClients(): Map<string, GoogleGenerativeAI> {
  const clients = new Map<string, GoogleGenerativeAI>()

  const primary = process.env.GEMINI_API_KEY
  const secondary = process.env.GEMINI_API_KEY_SECONDARY
  const tertiary = process.env.GEMINI_API_KEY_TERTIARY

  if (primary) clients.set('primary', new GoogleGenerativeAI(primary))
  if (secondary) clients.set('secondary', new GoogleGenerativeAI(secondary))
  if (tertiary) clients.set('tertiary', new GoogleGenerativeAI(tertiary))

  return clients
}

export type GeminiModel =
  | 'gemini-2.5-flash'
  | 'gemini-2.5-pro'
  | 'gemini-2.0-flash'
  | 'gemini-2.0-flash-lite'
  | 'text-embedding-004'

export interface GeminiRequest {
  prompt: string
  model?: GeminiModel
  temperature?: number
  maxTokens?: number
  systemInstruction?: string
}

export interface GeminiResponse {
  text: string
  model: string
  tokensUsed?: number
  fallbackUsed: boolean
  keyUsed: string
}

/**
 * Model fallback map: when a model hits 429, try these alternatives
 */
const MODEL_FALLBACKS: Record<string, GeminiModel[]> = {
  'gemini-2.5-pro': ['gemini-2.5-flash', 'gemini-2.0-flash'],
  'gemini-2.5-flash': ['gemini-2.0-flash'],
  'gemini-2.0-flash': ['gemini-2.5-flash'],
}

function is429Error(error: any): boolean {
  const msg = error?.message || ''
  return error?.status === 429 || msg.includes('429') || msg.includes('Too Many Requests') || msg.includes('quota')
}

/**
 * Generate content using Gemini with automatic key + model fallback
 * On 429 rate limit errors, automatically falls back to a cheaper/available model
 */
export async function generateContent(
  request: GeminiRequest
): Promise<GeminiResponse> {
  const requestedModel = request.model || config.gemini.defaultModel as GeminiModel
  // Build the list of models to try: requested model first, then fallbacks
  const modelsToTry: GeminiModel[] = [requestedModel, ...(MODEL_FALLBACKS[requestedModel] || [])]
  const startTime = Date.now()
  const clients = getClients()

  if (clients.size === 0) {
    console.error('No Gemini API keys found in environment. GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'SET' : 'MISSING')
    throw new Error('No Gemini API keys configured. Please set GEMINI_API_KEY in your environment variables.')
  }

  const availableKeys = config.gemini.fallbackOrder.filter((k) => clients.has(k))
  if (availableKeys.length === 0) {
    console.error('No Gemini API keys found in environment. GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'SET' : 'MISSING')
    throw new Error('No Gemini API keys configured. Please set GEMINI_API_KEY in your environment variables.')
  }

  let lastError: Error | null = null

  // Try each model (requested first, then fallbacks on 429)
  for (const model of modelsToTry) {
    // Try each available API key for this model
    for (const keyType of availableKeys) {
      const client = clients.get(keyType)!

      try {
        const generativeModel = client.getGenerativeModel({
          model,
          systemInstruction: request.systemInstruction,
        })

        const result = await generativeModel.generateContent({
          contents: [{ role: 'user', parts: [{ text: request.prompt }] }],
          generationConfig: {
            temperature: request.temperature ?? 0.7,
            maxOutputTokens: request.maxTokens ?? 2048,
          },
        })

        const response = await result.response
        const text = response.text()

        const usedFallbackModel = model !== requestedModel
        if (usedFallbackModel) {
          console.log(`✓ Model fallback succeeded: ${requestedModel} → ${model} (key: ${keyType})`)
        }

        await logApiCall({
          service: 'gemini',
          endpoint: model,
          method: 'POST',
          statusCode: 200,
          responseTime: Date.now() - startTime,
          fallbackUsed: keyType !== 'primary' || usedFallbackModel,
        })

        return {
          text,
          model,
          tokensUsed: response.usageMetadata?.totalTokenCount,
          fallbackUsed: keyType !== 'primary' || usedFallbackModel,
          keyUsed: keyType,
        }
      } catch (error: any) {
        lastError = error
        console.error(`Gemini API error [${model}/${keyType}]:`, error.message?.slice(0, 200))

        await logApiCall({
          service: 'gemini',
          endpoint: model,
          method: 'POST',
          statusCode: error.status || 500,
          responseTime: Date.now() - startTime,
          error: error.message,
          fallbackUsed: keyType !== 'primary',
        })

        // If it's a 429 rate limit error, skip remaining keys for this model
        // (quota is per-model, not per-key) and try the next model
        if (is429Error(error)) {
          console.log(`⚠ Rate limited on ${model}, trying fallback model...`)
          break
        }

        // For non-429 errors, try next key
        console.log(`Trying next API key for ${model}...`)
      }
    }
  }

  throw new Error(`All Gemini API keys failed. Last error: ${lastError?.message || 'Unknown error'}`)
}

/**
 * Fallback to OpenRouter (free models like DeepSeek R1, Llama 3.3)
 * Used when all Gemini keys/models are rate-limited
 */
async function callOpenRouter(request: GeminiRequest): Promise<GeminiResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY || config.optional.openrouter.apiKey
  if (!apiKey) throw new Error('OpenRouter API key not configured')

  const orModel = config.optional.openrouter.defaultModel
  const startTime = Date.now()

  const response = await fetch(`${config.optional.openrouter.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': config.app.url,
      'X-Title': 'Project Catalyst',
    },
    body: JSON.stringify({
      model: orModel,
      messages: [
        ...(request.systemInstruction ? [{ role: 'system', content: request.systemInstruction }] : []),
        { role: 'user', content: request.prompt },
      ],
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? 2048,
    }),
  })

  if (!response.ok) {
    const errBody = await response.text()
    throw new Error(`OpenRouter error (${response.status}): ${errBody.slice(0, 300)}`)
  }

  const data = await response.json()
  const text = data.choices?.[0]?.message?.content || ''

  await logApiCall({
    service: 'openrouter',
    endpoint: orModel,
    method: 'POST',
    statusCode: 200,
    responseTime: Date.now() - startTime,
    fallbackUsed: true,
  })

  return {
    text,
    model: `openrouter/${orModel}`,
    tokensUsed: data.usage?.total_tokens,
    fallbackUsed: true,
    keyUsed: 'openrouter',
  }
}

/**
 * Fallback to DeepSeek API directly
 * Used when both Gemini and OpenRouter fail
 */
async function callDeepSeek(request: GeminiRequest): Promise<GeminiResponse> {
  const apiKey = process.env.DEEPSEEK_API_KEY || config.optional.deepseek.apiKey
  if (!apiKey) throw new Error('DeepSeek API key not configured')

  const dsModel = config.optional.deepseek.defaultModel
  const startTime = Date.now()

  const response = await fetch(`${config.optional.deepseek.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: dsModel,
      messages: [
        ...(request.systemInstruction ? [{ role: 'system', content: request.systemInstruction }] : []),
        { role: 'user', content: request.prompt },
      ],
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? 2048,
    }),
  })

  if (!response.ok) {
    const errBody = await response.text()
    throw new Error(`DeepSeek error (${response.status}): ${errBody.slice(0, 300)}`)
  }

  const data = await response.json()
  const text = data.choices?.[0]?.message?.content || ''

  await logApiCall({
    service: 'deepseek',
    endpoint: dsModel,
    method: 'POST',
    statusCode: 200,
    responseTime: Date.now() - startTime,
    fallbackUsed: true,
  })

  return {
    text,
    model: `deepseek/${dsModel}`,
    tokensUsed: data.usage?.total_tokens,
    fallbackUsed: true,
    keyUsed: 'deepseek',
  }
}

/**
 * Smart generate: tries Gemini (with model fallback), then OpenRouter, then DeepSeek
 * This is the main entry point — always use this instead of generateContent directly
 */
export async function smartGenerate(request: GeminiRequest): Promise<GeminiResponse> {
  // 1. Try Gemini (with key + model fallback)
  try {
    return await generateContent(request)
  } catch (geminiError: any) {
    console.warn(`Gemini failed: ${geminiError.message?.slice(0, 150)}`)

    // Only fallback to alternative providers on rate limit errors
    if (!is429Error(geminiError)) {
      throw geminiError
    }
  }

  // 2. Try OpenRouter (free models)
  try {
    console.log('⚡ Falling back to OpenRouter...')
    return await callOpenRouter(request)
  } catch (orError: any) {
    console.warn(`OpenRouter failed: ${orError.message?.slice(0, 150)}`)
  }

  // 3. Try DeepSeek
  try {
    console.log('⚡ Falling back to DeepSeek...')
    return await callDeepSeek(request)
  } catch (dsError: any) {
    console.warn(`DeepSeek failed: ${dsError.message?.slice(0, 150)}`)
  }

  throw new Error('All AI providers exhausted (Gemini, OpenRouter, DeepSeek). Please try again later.')
}

/**
 * Generate embeddings for text using Gemini
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const startTime = Date.now()
  const clients = getClients()
  const availableKeys = config.gemini.fallbackOrder.filter((k) => clients.has(k))

  if (availableKeys.length === 0) {
    throw new Error('No Gemini API keys configured for embedding.')
  }

  let lastError: Error | null = null

  for (const keyType of availableKeys) {
    const client = clients.get(keyType)!

    try {
      const model = client.getGenerativeModel({ model: config.gemini.embeddingModel })
      const result = await model.embedContent(text)

      await logApiCall({
        service: 'gemini',
        endpoint: 'embedding',
        method: 'POST',
        statusCode: 200,
        responseTime: Date.now() - startTime,
        fallbackUsed: keyType !== 'primary',
      })

      return result.embedding.values
    } catch (error: any) {
      lastError = error
      console.error(`Gemini embedding error with ${keyType} key:`, error.message)

      await logApiCall({
        service: 'gemini',
        endpoint: 'embedding',
        method: 'POST',
        statusCode: error.status || 500,
        responseTime: Date.now() - startTime,
        error: error.message,
        fallbackUsed: keyType !== 'primary',
      })
    }
  }

  throw new Error(`All Gemini API keys failed for embedding. Last error: ${lastError?.message || 'Unknown error'}`)
}

/**
 * Stream content generation (for chat interfaces)
 */
export async function* streamContent(
  request: GeminiRequest
): AsyncGenerator<string, void, unknown> {
  const model = request.model || config.gemini.defaultModel as GeminiModel
  const clients = getClients()
  const availableKeys = config.gemini.fallbackOrder.filter((k) => clients.has(k))

  if (availableKeys.length === 0) {
    throw new Error('No Gemini API keys configured for streaming.')
  }

  let lastError: Error | null = null

  for (const keyType of availableKeys) {
    const client = clients.get(keyType)!

    try {
      const generativeModel = client.getGenerativeModel({
        model,
        systemInstruction: request.systemInstruction,
      })

      const result = await generativeModel.generateContentStream({
        contents: [{ role: 'user', parts: [{ text: request.prompt }] }],
        generationConfig: {
          temperature: request.temperature ?? 0.7,
          maxOutputTokens: request.maxTokens ?? 2048,
        },
      })

      for await (const chunk of result.stream) {
        const text = chunk.text()
        yield text
      }

      return
    } catch (error: any) {
      lastError = error
      console.error(`Gemini stream error with ${keyType} key:`, error.message)
    }
  }

  throw new Error(`All Gemini API keys failed for streaming. Last error: ${lastError?.message || 'Unknown error'}`)
}

/**
 * Check API health and quota status
 */
export async function checkApiHealth(): Promise<{
  available: boolean
  keys: { type: string; status: 'ok' | 'error' }[]
}> {
  const keys: { type: string; status: 'ok' | 'error' }[] = []
  const clients = getClients()

  for (const keyType of config.gemini.fallbackOrder) {
    const client = clients.get(keyType)
    if (!client) {
      keys.push({ type: keyType, status: 'error' })
      continue
    }

    try {
      const model = client.getGenerativeModel({ model: config.gemini.flashModel as GeminiModel })
      await model.generateContent('test')
      keys.push({ type: keyType, status: 'ok' })
    } catch (error) {
      keys.push({ type: keyType, status: 'error' })
    }
  }

  return {
    available: keys.some((k) => k.status === 'ok'),
    keys,
  }
}
