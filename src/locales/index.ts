import bn from './bn.json';
import en from './en.json';

export type Locale = 'bn' | 'en';
export type Dictionary = typeof bn;

export const dictionaries = {
  bn,
  en,
};

export function getDictionary(locale: Locale = 'bn'): Dictionary {
  return dictionaries[locale] || dictionaries.bn;
}
