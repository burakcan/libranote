export const SUPPORTED_SOCIAL_PROVIDERS = ["google", "github"] as const;

export type SupportedSocialProvider =
  (typeof SUPPORTED_SOCIAL_PROVIDERS)[number];
