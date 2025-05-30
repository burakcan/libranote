export const env = {
  PORT: process.env.PORT || 3030,
  PUBLIC_URL: process.env.PUBLIC_URL || "",
  AUTH_TRUSTED_ORIGINS: process.env.AUTH_TRUSTED_ORIGINS || "",
  AUTH_COOKIE_DOMAIN: process.env.AUTH_COOKIE_DOMAIN || "",
  AUTH_SECRET: process.env.AUTH_SECRET || "",
  // AWS SES Configuration
  AWS_REGION: process.env.AWS_REGION || "us-east-1",
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || "",
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || "",
  SES_FROM_EMAIL: process.env.SES_FROM_EMAIL || "",
  SES_FROM_NAME: process.env.SES_FROM_NAME || "LibraNote",
};

if (!env.PUBLIC_URL) {
  throw new Error("PUBLIC_URL is not set");
}

if (!env.AUTH_TRUSTED_ORIGINS) {
  throw new Error("AUTH_TRUSTED_ORIGINS is not set");
}

if (!env.AUTH_COOKIE_DOMAIN) {
  throw new Error("AUTH_COOKIE_DOMAIN is not set");
}

if (!env.PUBLIC_URL.includes("https://")) {
  throw new Error("PUBLIC_URL must include https://");
}

if (!env.AUTH_TRUSTED_ORIGINS.includes("https://")) {
  throw new Error("AUTH_TRUSTED_ORIGINS must include https://");
}

if (!env.AUTH_COOKIE_DOMAIN.includes(".")) {
  throw new Error("AUTH_COOKIE_DOMAIN must include a domain");
}

if (!env.AUTH_SECRET) {
  throw new Error("AUTH_SECRET is not set");
}

// AWS SES validation
if (!env.AWS_ACCESS_KEY_ID) {
  throw new Error("AWS_ACCESS_KEY_ID is not set");
}

if (!env.AWS_SECRET_ACCESS_KEY) {
  throw new Error("AWS_SECRET_ACCESS_KEY is not set");
}

if (!env.SES_FROM_EMAIL) {
  throw new Error("SES_FROM_EMAIL is not set");
}
