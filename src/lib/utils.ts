import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function toTitleCase(text: string): string {
  return text
    .toLocaleLowerCase("tr-TR")
    .replace(/(^|\s)\S/g, (char) => char.toLocaleUpperCase("tr-TR"));
}
