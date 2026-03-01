const isDev = process.env.NODE_ENV === "development";

export const logger = {
  debug(message: string, data?: unknown) {
    if (isDev) console.debug(`[DEBUG] ${message}`, data ?? "");
  },
  info(message: string, data?: unknown) {
    console.info(`[INFO] ${message}`, data ?? "");
  },
  warn(message: string, data?: unknown) {
    console.warn(`[WARN] ${message}`, data ?? "");
  },
  error(message: string, data?: unknown) {
    console.error(`[ERROR] ${message}`, data ?? "");
  },
};
