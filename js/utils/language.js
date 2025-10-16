const translations = {};
let currentLanguage = 'es';

async function loadLanguage(lang) {
  try {
    const response = await fetch(`assets/locales/${lang}.json`);
    if (!response.ok) {
      throw new Error(`Failed to load ${lang}.json`);
    }
    const data = await response.json();
    translations[lang] = data;
    currentLanguage = lang;
    updateUI();
  } catch (error) {
    console.error('Error loading language:', error);
  }
}

function getTranslation(key) {
  return translations[currentLanguage]?.[key] || key;
}

function updateUI() {
  document.querySelectorAll('[data-translate-key]').forEach(element => {
    const key = element.getAttribute('data-translate-key');
    const translation = getTranslation(key);

    if (element.tagName === 'INPUT' && element.placeholder) {
        element.placeholder = translation;
    } else {
        element.innerHTML = translation;
    }
  });
}

function setLanguage(lang) {
  if (lang !== currentLanguage && translations[lang]) {
    currentLanguage = lang;
    localStorage.setItem('preferredLanguage', lang);
    updateUI();
  } else if (!translations[lang]) {
    loadLanguage(lang).then(() => {
        localStorage.setItem('preferredLanguage', lang);
    });
  }
}

async function init() {
  const preferredLanguage = localStorage.getItem('preferredLanguage') || 'es';
  await loadLanguage(preferredLanguage);
}

export { init, setLanguage, getTranslation, updateUI };
