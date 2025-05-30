export const env = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3001,
  JWKS_URL: process.env.JWKS_URL || '',
  SSE_WEBHOOK_URL: process.env.SSE_WEBHOOK_URL || '',
  NODE_ENV: process.env.NODE_ENV || 'development',
};

// Environment validation
if (!env.JWKS_URL) {
  throw new Error('JWKS_URL is not set');
}

if (!env.SSE_WEBHOOK_URL) {
  throw new Error('SSE_WEBHOOK_URL is not set');
}

if (!env.JWKS_URL.startsWith('https://')) {
  throw new Error('JWKS_URL must be a valid HTTPS URL');
}

if (!env.SSE_WEBHOOK_URL.startsWith('http')) {
  throw new Error('SSE_WEBHOOK_URL must be a valid HTTP/HTTPS URL');
}

if (env.PORT < 1 || env.PORT > 65535) {
  throw new Error('PORT must be a valid port number (1-65535)');
}

console.info(`Environment configuration loaded for ${env.NODE_ENV}`);
