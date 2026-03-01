export const APP_NAME = "AÜ Asistan";
export const DEFAULT_LOCALE = "tr";
export const SUPPORTED_LOCALES = ["tr", "en"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
