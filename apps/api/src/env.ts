export const env = {
  PORT: process.env.PORT || 3030,
  PUBLIC_URL: process.env.PUBLIC_URL || "",
  AUTH_TRUSTED_ORIGINS: process.env.AUTH_TRUSTED_ORIGINS || "",
  AUTH_COOKIE_DOMAIN: process.env.AUTH_COOKIE_DOMAIN || "",
  AUTH_SECRET: process.env.AUTH_SECRET || "",
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
