import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import bn from './bn.json';
import { appStorage } from '../storage/mmkv';

export type SupportedLocale = 'en' | 'bn';

const LANG_KEY = 'az_app_language';

export function getStoredLocale(): SupportedLocale {
  const saved = appStorage.getString(LANG_KEY);
  return saved === 'bn' ? 'bn' : 'en';
}

export function saveLocale(locale: SupportedLocale): void {
  appStorage.set(LANG_KEY, locale);
  void i18n.changeLanguage(locale);
}

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    compatibilityJSON: 'v4',
    lng: getStoredLocale(),
    fallbackLng: 'en',
    resources: {
      en: { translation: en },
      bn: { translation: bn },
    },
    interpolation: {
      escapeValue: false,
    },
  });
}

export default i18n;
