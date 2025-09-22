import { pl } from './pl';
import { en } from './en';

// Automatyczne generowanie typów na podstawie polskich tłumaczeń
export type TranslationKey = typeof pl;
export type Language = 'pl' | 'en';

export interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
}

export const availableLanguages: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski' }
];

export const translations = {
  pl,
  en
} as const;