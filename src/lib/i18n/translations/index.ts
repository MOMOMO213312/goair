import ar from "./ar";
import en from "./en";

export type Language = "ar" | "en";

export const LANGUAGES: Language[] = ["ar", "en"];

export const DEFAULT_LANGUAGE: Language = "ar";

export const translations = { ar, en } as const;

// Dot-notation keys into the ar dictionary, e.g. "home.hero.title".
// en.ts MUST mirror this exact shape or TypeScript will flag it as a mismatch.
type DotPaths<T, Prefix extends string = ""> = T extends string
  ? never
  : {
      [K in keyof T & string]: T[K] extends string
        ? `${Prefix}${K}`
        : DotPaths<T[K], `${Prefix}${K}.`>;
    }[keyof T & string];

export type TranslationKey = DotPaths<typeof ar>;
