import { pino, Logger } from 'pino'
import { join } from 'path'
import { homedir } from 'os'
import { mkdirSync } from 'fs'

let pinoLogger: Logger | null = null
let debugMode = false

export function initializeLogger(debug = false): void {
  debugMode = debug

  // Create logs directory if it doesn't exist
  // Use project directory for development, home directory for production
  const logDir =
    process.env.DEV === 'true'
      ? join(process.cwd(), 'logs')
      : join(homedir(), '.git-rake', 'logs')

  try {
    mkdirSync(logDir, { recursive: true })
  } catch (error) {
    // Fallback to current directory if chosen directory is not writable
  }

  const logFile = join(logDir, 'git-rake.log')

  pinoLogger = pino(
    {
      level: debug ? 'debug' : 'warn',
      timestamp: pino.stdTimeFunctions.isoTime,
      formatters: {
        level(label: string) {
          return { level: label }
        },
      },
    },
    pino.destination({
      dest: logFile,
      mkdir: true,
      // Async for better performance
      sync: false,
    }),
  )
}

function ensureLogger(): Logger {
  if (!pinoLogger) {
    initializeLogger(false)
  }
  return pinoLogger!
}

export function logError(message: string, meta?: object): void {
  ensureLogger().error(meta || {}, message)
}

export function logWarn(message: string, meta?: object): void {
  ensureLogger().warn(meta || {}, message)
}

export function logInfo(message: string, meta?: object): void {
  if (debugMode) {
    ensureLogger().info(meta || {}, message)
  }
}

export function logDebug(message: string, meta?: object): void {
  if (debugMode) {
    ensureLogger().debug(meta || {}, message)
  }
}

export const logger = {
  error: logError,
  warn: logWarn,
  info: logInfo,
  debug: logDebug,
}
