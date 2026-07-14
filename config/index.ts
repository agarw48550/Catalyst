/**
 * Configuration module for environment variables and app settings
 * Centralizes all configuration logic and provides type-safe access
 */

export const config = {
  // App settings
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    environment: process.env.NODE_ENV || 'development',
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
  },

  // Supabase configuration
  // Prefer NEXT_PUBLIC_* names; fall back to Vercel Marketplace / server-only aliases.
  supabase: {
    url:
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.SUPABASE_URL ||
      '',
    anonKey:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.SUPABASE_PUBLISHABLE_KEY ||
      '',
    serviceRoleKey:
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SECRET_KEY ||
      '',
  },

  // Gemini AI configuration
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    apiKeySecondary: process.env.GEMINI_API_KEY_SECONDARY || '',
    apiKeyTertiary: process.env.GEMINI_API_KEY_TERTIARY || '',
    defaultModel: process.env.GEMINI_DEFAULT_MODEL || 'gemma-4-31b-it',
    flashModel: process.env.GEMINI_FLASH_MODEL || 'gemma-4-31b-it',
    liveModel: process.env.GEMINI_LIVE_MODEL || 'gemini-3.1-flash-live-preview',
    embeddingModel: process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004',
    // Fallback order for API keys
    fallbackOrder: ['primary', 'secondary', 'tertiary'] as const,
  },

  // Web search
  search: {
    tavilyApiKey: process.env.TAVILY_API_KEY || '',
  },

  // Email services
  email: {
    mailgun: {
      apiKey: process.env.MAILGUN_API_KEY || '',
      domain: process.env.MAILGUN_DOMAIN || '',
      fromEmail: process.env.MAILGUN_FROM_EMAIL || 'noreply@catalyst.app',
    },
    resend: {
      apiKey: process.env.RESEND_API_KEY || '',
      fromEmail: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
    },
    // Fallback order: try Mailgun first, then Resend
    fallbackOrder: ['mailgun', 'resend'] as const,
  },

  // Job APIs
  jobs: {
    ncs: {
      apiKey: process.env.NCS_API_KEY || '',
      apiUrl: process.env.NCS_API_URL || 'https://api.ncs.gov.in',
    },
    jooble: {
      apiKey: process.env.JOOBLE_API_KEY || '',
      apiUrl: process.env.JOOBLE_API_URL || 'https://jooble.org/api',
    },
    adzuna: {
      appId: process.env.ADZUNA_APP_ID || '',
      apiKey: process.env.ADZUNA_API_KEY || '',
      apiUrl: process.env.ADZUNA_API_URL || 'https://api.adzuna.com/v1/api',
    },
    // Fallback order for job APIs — Jooble first (most reliable), then Adzuna
    fallbackOrder: ['jooble', 'adzuna'] as const,
    cacheEnabled: true,
    cacheTTL: 3600, // 1 hour in seconds
  },

  // Optional services
  optional: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
    },
    openrouter: {
      apiKey: process.env.OPENROUTER_API_KEY || '',
      baseUrl: 'https://openrouter.ai/api/v1',
      // Free models on OpenRouter
      defaultModel: 'google/gemma-4-31b-it:free',
      fallbackModel: 'meta-llama/llama-3.3-8b-instruct:free',
    },
    huggingface: {
      apiKey: process.env.HUGGINGFACE_API_KEY || '',
    },
    deepseek: {
      apiKey: process.env.DEEPSEEK_API_KEY || '',
      baseUrl: 'https://api.deepseek.com/v1',
      defaultModel: 'deepseek-chat',
    },
    redis: {
      url: process.env.REDIS_URL || '',
      password: process.env.REDIS_PASSWORD || '',
    },
  },

  // Feature flags — voice interview is on by default (core product feature)
  features: {
    debugDashboard: process.env.NEXT_PUBLIC_ENABLE_DEBUG_DASHBOARD === 'true',
    voiceInterview: process.env.NEXT_PUBLIC_ENABLE_VOICE_INTERVIEW !== 'false',
    aiCoach: process.env.NEXT_PUBLIC_ENABLE_AI_COACH !== 'false',
  },

  // Rate limiting and quotas
  quotas: {
    maxRequestsPerHour: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    maxResumeUploadsPerDay: parseInt(process.env.MAX_RESUME_UPLOADS_PER_DAY || '10', 10),
    maxInterviewSessionsPerDay: parseInt(process.env.MAX_INTERVIEW_SESSIONS_PER_DAY || '5', 10),
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableApiLogging: process.env.ENABLE_API_LOGGING === 'true',
  },

  // Security
  security: {
    jwtSecret: process.env.JWT_SECRET || '',
  },
} as const

// Real Google AI Studio keys traditionally start with "AIzaSy" (39 chars).
// Newer AI Studio / Gemini keys may use other prefixes — only warn on clearly placeholder values.
const GEMINI_KEY_PLACEHOLDER = /^(your-|xxx|sk-test)/i

function warnIfMalformedGeminiKey(name: string, value: string) {
  if (!value) return
  if (GEMINI_KEY_PLACEHOLDER.test(value) || value.length < 20) {
    console.warn(
      `⚠️  ${name} looks like a placeholder or too short (length ${value.length}). Gemini requests will fail until you set a real Google AI Studio API key.`
    )
  }
}

/**
 * Validate that all required environment variables are set
 */
export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check required Supabase config
  if (!config.supabase.url) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL is required')
  }
  if (!config.supabase.anonKey) {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is required')
  }

  // Check at least one Gemini API key
  if (!config.gemini.apiKey) {
    errors.push('GEMINI_API_KEY is required')
  }

  // Warn (non-blocking) if any configured Gemini key doesn't look like a real Google API key
  warnIfMalformedGeminiKey('GEMINI_API_KEY', config.gemini.apiKey)
  warnIfMalformedGeminiKey('GEMINI_API_KEY_SECONDARY', config.gemini.apiKeySecondary)
  warnIfMalformedGeminiKey('GEMINI_API_KEY_TERTIARY', config.gemini.apiKeyTertiary)

  // Warn if no email service is configured (non-blocking)
  if (!config.email.mailgun.apiKey && !config.email.resend.apiKey) {
    console.warn('⚠️  No email service configured (MAILGUN_API_KEY or RESEND_API_KEY)')
  }

  // Warn if no job APIs are configured (non-blocking)
  const hasJobApi = config.jobs.ncs.apiKey || config.jobs.jooble.apiKey || config.jobs.adzuna.apiKey
  if (!hasJobApi) {
    console.warn('⚠️  No job API configured (NCS_API_KEY, JOOBLE_API_KEY, or ADZUNA_APP_ID/ADZUNA_API_KEY)')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Get configuration for a specific service with fallback support
 */
export function getServiceConfig(service: 'gemini' | 'email' | 'jobs') {
  return config[service]
}
