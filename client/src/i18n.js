import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Fichiers de traduction (un par langue)
import translationEN from './locales/en/translation.json';
import translationFR from './locales/fr/translation.json';

// Regroupe les traductions par langue, dans le format attendu par i18next
const resources = {
  en: {
    translation: translationEN
  },
  fr: {
    translation: translationFR
  }
};

// Configuration de i18next, branchée sur React grâce à initReactI18next
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'fr', // langue par défaut
    fallbackLng: 'en', // si une traduction manque, on se rabat sur l'anglais
    interpolation: {
      escapeValue: false // React échappe déjà le contenu, pas besoin de le faire deux fois
    }
  });

export default i18n;