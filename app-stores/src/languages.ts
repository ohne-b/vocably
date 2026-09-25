// The languages Vocably's interface is translated into.
// The code becomes the language folder name in the exported ZIP.
export const languages = ['en', 'es', 'pt', 'ru', 'uk', 'tr', 'vi'] as const;

export type Language = (typeof languages)[number];

export const languageNames: Record<Language, string> = {
  en: 'English',
  es: 'Spanish',
  pt: 'Portuguese',
  ru: 'Russian',
  uk: 'Ukrainian',
  tr: 'Turkish',
  vi: 'Vietnamese',
};
