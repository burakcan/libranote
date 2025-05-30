// Global type definitions for Node.js environment

declare global {
  // Make fetch available globally for Node.js 18+ (it's available but TypeScript might not recognize it)
  var fetch: typeof globalThis.fetch;
}

export {};
