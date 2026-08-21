type LogLevel = 'info' | 'warn' | 'error';

interface LogPayload {
  message: string;
  context?: Record<string, any>;
  error?: any;
}

const SENSITIVE_KEYS = ['password', 'token', 'secret', 'key', 'auth', 'card', 'cvv'];

function sanitizeContext(context?: Record<string, any>): Record<string, any> | undefined {
  if (!context) return undefined;
  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(context)) {
    const isSensitive = SENSITIVE_KEYS.some((k) => key.toLowerCase().includes(k));
    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeContext(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

function log(level: LogLevel, { message, context, error }: LogPayload) {
  const timestamp = new Date().toISOString();
  const safeContext = sanitizeContext(context);

  const output = {
    timestamp,
    level: level.toUpperCase(),
    message,
    ...(safeContext ? { context: safeContext } : {}),
    ...(error ? { error: error.message || String(error) } : {}),
  };

  if (level === 'error') {
    console.error(`[PROS LOG ERROR] ${timestamp} - ${message}`, output);
  } else if (level === 'warn') {
    console.warn(`[PROS LOG WARN] ${timestamp} - ${message}`, output);
  } else {
    console.log(`[PROS LOG INFO] ${timestamp} - ${message}`, output);
  }
}

export const logger = {
  info: (message: string, context?: Record<string, any>) => log('info', { message, context }),
  warn: (message: string, context?: Record<string, any>) => log('warn', { message, context }),
  error: (message: string, error?: any, context?: Record<string, any>) => log('error', { message, error, context }),
};
