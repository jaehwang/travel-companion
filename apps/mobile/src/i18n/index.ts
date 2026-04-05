import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

import en from './en.json';
import ko from './ko.json';

const deviceLocale = getLocales()[0]?.languageCode ?? 'en';
const supportedLocales = ['en', 'ko'];
const lng = supportedLocales.includes(deviceLocale) ? deviceLocale : 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ko: { translation: ko },
    },
    lng,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
export { lng };
