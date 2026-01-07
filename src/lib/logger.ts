/**
 * Slice-0 Logger
 * 
 * CONSTRAINT: Log only IDs + timings. Never log raw script text or full report JSON.
 */

type LogLevel = "info" | "warn" | "error" | "debug";

interface LogContext {
  job_id?: string;
  script_id?: string;
  run_id?: string;
  user_id?: string;
  duration_ms?: number;
  status?: string;
  [key: string]: string | number | boolean | undefined;
}

function formatLog(level: LogLevel, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString();
  const contextStr = context ? ` ${JSON.stringify(context)}` : "";
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
}

export const logger = {
  info(message: string, context?: LogContext): void {
    console.log(formatLog("info", message, context));
  },

  warn(message: string, context?: LogContext): void {
    console.warn(formatLog("warn", message, context));
  },

  error(message: string, context?: LogContext): void {
    console.error(formatLog("error", message, context));
  },

  debug(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV === "development") {
      console.debug(formatLog("debug", message, context));
    }
  },

  /**
   * Log the start of an operation with timing
   */
  startTimer(operation: string, context?: LogContext): () => void {
    const start = Date.now();
    logger.info(`${operation} started`, context);
    
    return () => {
      const duration_ms = Date.now() - start;
      logger.info(`${operation} completed`, { ...context, duration_ms });
    };
  },
};

export default logger;
