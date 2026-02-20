import { GoogleGenerativeAI } from '@google/generative-ai'
import { config } from '@/config'
import { logApiCall } from '@/lib/logger'

/**
 * Gemini AI Client with multi-key fallback support
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
 * Generate content using Gemini with automatic fallback
 */
export async function generateContent(
  request: GeminiRequest
): Promise<GeminiResponse> {
  const model = request.model || config.gemini.defaultModel as GeminiModel
  const startTime = Date.now()
  const clients = getClients()

  if (clients.size === 0) {
    console.error('No Gemini API keys found in environment. GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'SET' : 'MISSING')
    throw new Error('No Gemini API keys configured. Please set GEMINI_API_KEY in your environment variables.')
  }

  // Build ordered list of available clients only
  const availableKeys = config.gemini.fallbackOrder.filter((k) => clients.has(k))
  if (availableKeys.length === 0) {
    console.error('No Gemini API keys found in environment. GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'SET' : 'MISSING')
    throw new Error('No Gemini API keys configured. Please set GEMINI_API_KEY in your environment variables.')
  }

  let lastError: Error | null = null

  // Try each available API key in fallback order
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

      // Log successful call
      await logApiCall({
        service: 'gemini',
        endpoint: model,
        method: 'POST',
        statusCode: 200,
        responseTime: Date.now() - startTime,
        fallbackUsed: keyType !== 'primary',
      })

      return {
        text,
        model,
        tokensUsed: response.usageMetadata?.totalTokenCount,
        fallbackUsed: keyType !== 'primary',
        keyUsed: keyType,
      }
    } catch (error: any) {
      lastError = error
      console.error(`Gemini API error with ${keyType} key:`, error.message)

      // Log failed attempt
      await logApiCall({
        service: 'gemini',
        endpoint: model,
        method: 'POST',
        statusCode: error.status || 500,
        responseTime: Date.now() - startTime,
        error: error.message,
        fallbackUsed: keyType !== 'primary',
      })

      // Continue to next available key
      console.log(`Trying next API key...`)
    }
  }

  throw new Error(`All Gemini API keys failed. Last error: ${lastError?.message || 'Unknown error'}`)
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
