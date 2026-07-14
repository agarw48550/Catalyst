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
  | 'gemini-3.1-flash-lite'
  | 'gemma-4-31b-it'
  | 'gemma-4-26b-a4b-it'
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

type GeminiContentPart = {
  text?: string
  inlineData?: {
    mimeType: string
    data: string
  }
}

type GeminiContents = Array<{
  role: 'user'
  parts: GeminiContentPart[]
}>

interface GeminiContentsRequest {
  contents: GeminiContents
  modelCandidates: GeminiModel[]
  temperature?: number
  maxTokens?: number
  systemInstruction?: string
}

export const RESUME_MODEL_CANDIDATES = [
  'gemma-4-31b-it',
  'gemma-4-26b-a4b-it',
  'gemini-3.1-flash-lite',
] as const satisfies readonly GeminiModel[]

/**
 * Model fallback map: when a model fails, try these alternatives
 * Text models: Gemma 31B → Gemma 26B → Gemini 3.1 Flash Lite
 */
const MODEL_FALLBACKS: Record<string, GeminiModel[]> = {
  'gemma-4-31b-it': ['gemma-4-26b-a4b-it', 'gemini-3.1-flash-lite'],
  'gemma-4-26b-a4b-it': ['gemini-3.1-flash-lite', 'gemma-4-31b-it'],
  'gemini-3.1-flash-lite': ['gemma-4-26b-a4b-it', 'gemma-4-31b-it'],
  'gemini-2.5-pro': ['gemini-3.1-flash-lite', 'gemini-2.5-flash', 'gemini-2.0-flash'],
  'gemini-2.5-flash': ['gemini-3.1-flash-lite', 'gemini-2.0-flash'],
  'gemini-2.0-flash': ['gemini-3.1-flash-lite', 'gemini-2.5-flash'],
}

function is429Error(error: any): boolean {
  const msg = error?.message || ''
  return error?.status === 429 || msg.includes('429') || msg.includes('Too Many Requests') || msg.includes('quota')
}

function getAvailableKeys(clients: Map<string, GoogleGenerativeAI>) {
  const availableKeys = config.gemini.fallbackOrder.filter((keyType) => clients.has(keyType))

  if (clients.size === 0 || availableKeys.length === 0) {
    console.error('No Gemini API keys found in environment. GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'SET' : 'MISSING')
    throw new Error('No Gemini API keys configured. Please set GEMINI_API_KEY in your environment variables.')
  }

  return availableKeys
}

async function generateContentWithCandidates({
  contents,
  modelCandidates,
  temperature,
  maxTokens,
  systemInstruction,
}: GeminiContentsRequest): Promise<GeminiResponse> {
  if (modelCandidates.length === 0) {
    throw new Error('At least one Gemini model candidate is required.')
  }

  const startTime = Date.now()
  const clients = getClients()
  const availableKeys = getAvailableKeys(clients)
  const requestedModel = modelCandidates[0]

  let lastError: Error | null = null

  for (const model of modelCandidates) {
    for (const keyType of availableKeys) {
      const client = clients.get(keyType)!

      try {
        const generativeModel = client.getGenerativeModel({
          model,
          systemInstruction,
        })

        const result = await generativeModel.generateContent({
          contents,
          generationConfig: {
            temperature: temperature ?? 0.7,
            maxOutputTokens: maxTokens ?? 2048,
          },
        } as any)

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
        const isKeyInvalid = Boolean(error?.message?.includes('API key not valid'))
        if (isKeyInvalid) {
          console.error(`Gemini API error [${model}/${keyType}]: API key '${keyType}' is invalid — check GEMINI_API_KEY${keyType === 'primary' ? '' : `_${keyType.toUpperCase()}`} in your environment.`)
        } else {
          console.error(`Gemini API error [${model}/${keyType}]:`, error.message?.slice(0, 200))
        }

        await logApiCall({
          service: 'gemini',
          endpoint: model,
          method: 'POST',
          statusCode: error.status || 500,
          responseTime: Date.now() - startTime,
          error: error.message,
          fallbackUsed: keyType !== 'primary' || model !== requestedModel,
        })

        // Invalid keys: try next key for the same model.
        // Rate limits / model errors: switch to the next candidate model.
        if (isKeyInvalid) {
          console.log(`Trying next API key for ${model}...`)
          continue
        }

        console.log(`⚠ ${model} failed (${is429Error(error) ? 'rate limited' : 'error'}) — switching to next model...`)
        break
      }
    }
  }

  throw new Error(`All Gemini API keys failed. Last error: ${lastError?.message || 'Unknown error'}`)
}

/**
 * Generate content using Gemini with automatic key + model fallback
 * On 429 rate limit errors, automatically falls back to a cheaper/available model
 */
export async function generateContent(
  request: GeminiRequest
): Promise<GeminiResponse> {
  const requestedModel = request.model || config.gemini.defaultModel as GeminiModel
  const modelsToTry: GeminiModel[] = [requestedModel, ...(MODEL_FALLBACKS[requestedModel] || [])]
  return generateContentWithCandidates({
    contents: [{ role: 'user', parts: [{ text: request.prompt }] }],
    modelCandidates: modelsToTry,
    temperature: request.temperature,
    maxTokens: request.maxTokens,
    systemInstruction: request.systemInstruction,
  })
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
 * Smart generate: tries Gemini (with model fallback) first, then OpenRouter, then DeepSeek
 * This is the main entry point — always use this instead of generateContent directly
 */
export async function smartGenerate(request: GeminiRequest): Promise<GeminiResponse> {
  let result: GeminiResponse | null = null

  // 1. Try Gemini (with key + model fallback)
  try {
    result = await generateContent(request)
  } catch (geminiError: any) {
    console.warn(`Gemini failed: ${geminiError.message?.slice(0, 150)}`)

    // Only fallback to alternative providers on rate limit errors
    if (!is429Error(geminiError)) {
      throw geminiError
    }

    // 2. Try OpenRouter (free models)
    try {
      console.log('⚡ Falling back to OpenRouter...')
      result = await callOpenRouter(request)
    } catch (orError: any) {
      console.warn(`OpenRouter failed: ${orError.message?.slice(0, 150)}`)

      // 3. Try DeepSeek
      try {
        console.log('⚡ Falling back to DeepSeek...')
        result = await callDeepSeek(request)
      } catch (dsError: any) {
        console.warn(`DeepSeek failed: ${dsError.message?.slice(0, 150)}`)
        throw new Error('All AI providers exhausted (Gemini, OpenRouter, DeepSeek). Please try again later.')
      }
    }
  }

  // Strip DeepSeek R1 chain-of-thought <think> blocks from the response
  if (result && result.text) {
    result.text = result.text.replace(/<think>[\s\S]*?<\/think>/g, '').trim()
  }

  return result!
}

export async function generateGeminiOnly(
  request: GeminiRequest & { modelCandidates: GeminiModel[] }
): Promise<GeminiResponse> {
  return generateContentWithCandidates({
    contents: [{ role: 'user', parts: [{ text: request.prompt }] }],
    modelCandidates: request.modelCandidates,
    temperature: request.temperature,
    maxTokens: request.maxTokens,
    systemInstruction: request.systemInstruction,
  })
}

export async function generateGeminiOnlyWithContents(
  request: GeminiContentsRequest
): Promise<GeminiResponse> {
  return generateContentWithCandidates(request)
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
