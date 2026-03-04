import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import vi from './locales/vi.json';


// Change en variabe to vi if you want to use Vietnamese and vice versa
// const defaultLng = 'vi';
const defaultLng = 'en';

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    resources: {
      en: { translation: en },
      vi: { translation: vi },
    },
    lng: defaultLng,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes
    },
  });

export default i18n;
