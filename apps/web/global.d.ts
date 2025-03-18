import messages from "./messages/en.json";
import { formats } from "./src/lib/i18n/request";

const locales = ["en"] as const;

declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof locales)[number];
    Messages: typeof messages;
    Formats: typeof formats;
  }
}