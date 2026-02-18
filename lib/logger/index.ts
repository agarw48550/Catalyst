/**
 * Logging and error tracking utilities
 */

import { supabaseAdmin } from '@/config/supabase'
import { config } from '@/config'

export interface ApiLogEntry {
  service: string
  endpoint: string
  method: string
  statusCode: number
  responseTime: number
  error?: string
  fallbackUsed: boolean
}

/**
 * Log API call to database
 */
export async function logApiCall(entry: ApiLogEntry): Promise<void> {
  // Only log in production or if API logging is enabled
  if (!config.logging.enableApiLogging && config.app.isProduction) {
    return
  }

  try {
    if (supabaseAdmin) {
      await supabaseAdmin.from('api_logs').insert({
        service: entry.service,
        endpoint: entry.endpoint,
        method: entry.method,
        status_code: entry.statusCode,
        response_time: entry.responseTime,
        error: entry.error || null,
        fallback_used: entry.fallbackUsed,
      })
    }

    // Also log to console in development
    if (config.app.isDevelopment) {
      const logLevel = entry.statusCode >= 400 ? 'error' : 'info'
      const fallbackIndicator = entry.fallbackUsed ? ' [FALLBACK]' : ''
      console[logLevel](
        `[${entry.service}] ${entry.method} ${entry.endpoint} - ${entry.statusCode} (${entry.responseTime}ms)${fallbackIndicator}`,
        entry.error ? `Error: ${entry.error}` : ''
      )
    }
  } catch (error) {
    // Don't fail the main operation if logging fails
    console.error('Failed to log API call:', error)
  }
}

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

/**
 * Logger class
 */
export class Logger {
  private context: string

  constructor(context: string) {
    this.context = context
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = ['debug', 'info', 'warn', 'error']
    const currentLevelIndex = levels.indexOf(config.logging.level)
    const requestedLevelIndex = levels.indexOf(level)
    return requestedLevelIndex >= currentLevelIndex
  }

  private log(level: LogLevel, message: string, meta?: any) {
    if (!this.shouldLog(level)) {
      return
    }

    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] [${this.context}] ${message}`

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(logMessage, meta || '')
        break
      case LogLevel.INFO:
        console.info(logMessage, meta || '')
        break
      case LogLevel.WARN:
        console.warn(logMessage, meta || '')
        break
      case LogLevel.ERROR:
        console.error(logMessage, meta || '')
        break
    }
  }

  debug(message: string, meta?: any) {
    this.log(LogLevel.DEBUG, message, meta)
  }

  info(message: string, meta?: any) {
    this.log(LogLevel.INFO, message, meta)
  }

  warn(message: string, meta?: any) {
    this.log(LogLevel.WARN, message, meta)
  }

  error(message: string, meta?: any) {
    this.log(LogLevel.ERROR, message, meta)
  }
}

/**
 * Create logger instance
 */
export function createLogger(context: string): Logger {
  return new Logger(context)
}

/**
 * Global error handler
 */
export function handleError(error: Error, context?: string): void {
  const logger = createLogger(context || 'Global')
  logger.error(error.message, { stack: error.stack })

  // In production, you might want to send to error tracking service
  if (config.app.isProduction) {
    // TODO: Send to Sentry or other error tracking service
  }
}

/**
 * Get API logs from database
 */
export async function getApiLogs(filters?: {
  service?: string
  limit?: number
  offset?: number
}): Promise<any[]> {
  if (!supabaseAdmin) {
    return []
  }

  try {
    let query = supabaseAdmin
      .from('api_logs')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters?.service) {
      query = query.eq('service', filters.service)
    }

    query = query.limit(filters?.limit || 100)

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 100) - 1)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Failed to fetch API logs:', error)
    return []
  }
}

/**
 * Get fallback statistics
 */
export async function getFallbackStats(): Promise<{
  service: string
  totalCalls: number
  fallbackCalls: number
  fallbackRate: number
}[]> {
  if (!supabaseAdmin) {
    return []
  }

  try {
    const { data, error } = await supabaseAdmin.rpc('get_fallback_stats')

    if (error) {
      // If RPC doesn't exist, return empty array
      return []
    }

    return data || []
  } catch (error) {
    console.error('Failed to fetch fallback stats:', error)
    return []
  }
}
