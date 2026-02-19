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
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },

  // Gemini AI configuration
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    apiKeySecondary: process.env.GEMINI_API_KEY_SECONDARY || '',
    apiKeyTertiary: process.env.GEMINI_API_KEY_TERTIARY || '',
    defaultModel: process.env.GEMINI_DEFAULT_MODEL || 'gemini-2.0-flash',
    flashModel: process.env.GEMINI_FLASH_MODEL || 'gemini-2.0-flash',
    embeddingModel: process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004',
    // Fallback order for API keys
    fallbackOrder: ['primary', 'secondary', 'tertiary'] as const,
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
    // Fallback order for job APIs
    fallbackOrder: ['ncs', 'jooble', 'adzuna'] as const,
    cacheEnabled: true,
    cacheTTL: 3600, // 1 hour in seconds
  },

  // Optional services
  optional: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
    },
    huggingface: {
      apiKey: process.env.HUGGINGFACE_API_KEY || '',
    },
    redis: {
      url: process.env.REDIS_URL || '',
      password: process.env.REDIS_PASSWORD || '',
    },
  },

  // Feature flags
  features: {
    debugDashboard: process.env.NEXT_PUBLIC_ENABLE_DEBUG_DASHBOARD === 'true',
    voiceInterview: process.env.NEXT_PUBLIC_ENABLE_VOICE_INTERVIEW === 'true',
    aiCoach: process.env.NEXT_PUBLIC_ENABLE_AI_COACH === 'true',
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
