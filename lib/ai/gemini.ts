import { GoogleGenerativeAI } from '@google/generative-ai'
import { config } from '@/config'
import { logApiCall } from '@/lib/logger'

/**
 * Gemini AI Client with multi-key fallback support
 */

// Initialize clients for each API key
const clients = new Map<string, GoogleGenerativeAI>()

if (config.gemini.apiKey) {
  clients.set('primary', new GoogleGenerativeAI(config.gemini.apiKey))
}
if (config.gemini.apiKeySecondary) {
  clients.set('secondary', new GoogleGenerativeAI(config.gemini.apiKeySecondary))
}
if (config.gemini.apiKeyTertiary) {
  clients.set('tertiary', new GoogleGenerativeAI(config.gemini.apiKeyTertiary))
}

export type GeminiModel = 
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
  
  // Try each API key in fallback order
  for (const keyType of config.gemini.fallbackOrder) {
    const client = clients.get(keyType)
    if (!client) continue

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

      // If this was the last key, throw the error
      if (keyType === config.gemini.fallbackOrder[config.gemini.fallbackOrder.length - 1]) {
        throw new Error(`All Gemini API keys failed. Last error: ${error.message}`)
      }
      
      // Otherwise, continue to next key
      console.log(`Trying next API key...`)
    }
  }

  throw new Error('No Gemini API keys available')
}

/**
 * Generate embeddings for text using Gemini
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const startTime = Date.now()

  for (const keyType of config.gemini.fallbackOrder) {
    const client = clients.get(keyType)
    if (!client) continue

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

      if (keyType === config.gemini.fallbackOrder[config.gemini.fallbackOrder.length - 1]) {
        throw new Error(`All Gemini API keys failed for embedding. Last error: ${error.message}`)
      }
    }
  }

  throw new Error('No Gemini API keys available for embedding')
}

/**
 * Stream content generation (for chat interfaces)
 */
export async function* streamContent(
  request: GeminiRequest
): AsyncGenerator<string, void, unknown> {
  const model = request.model || config.gemini.defaultModel as GeminiModel

  for (const keyType of config.gemini.fallbackOrder) {
    const client = clients.get(keyType)
    if (!client) continue

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
      console.error(`Gemini stream error with ${keyType} key:`, error.message)
      
      if (keyType === config.gemini.fallbackOrder[config.gemini.fallbackOrder.length - 1]) {
        throw new Error(`All Gemini API keys failed for streaming. Last error: ${error.message}`)
      }
    }
  }

  throw new Error('No Gemini API keys available for streaming')
}

/**
 * Check API health and quota status
 */
export async function checkApiHealth(): Promise<{
  available: boolean
  keys: { type: string; status: 'ok' | 'error' }[]
}> {
  const keys: { type: string; status: 'ok' | 'error' }[] = []

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
