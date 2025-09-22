import { i18n } from '../services/I18nService';
import { Language } from '../../locales/types';

export class LanguageSelector {
  private container: HTMLElement;
  private selectElement!: HTMLSelectElement; // Dodany ! (definite assignment assertion)

  constructor(containerId: string) {
    this.container = document.getElementById(containerId) || document.body;
    this.init();
  }

  private init(): void {
    this.createSelector();
    this.setupEventListeners();
    this.updateCurrentSelection();
  }

  private createSelector(): void {
    const wrapper = document.createElement('div');
    wrapper.className = 'language-selector';
    
    const label = document.createElement('label');
    label.textContent = i18n.t('settings.language');
    label.htmlFor = 'language-select';
    
    this.selectElement = document.createElement('select'); // Tu jest inicjalizowane
    this.selectElement.id = 'language-select';
    this.selectElement.className = 'language-select';
    
    // Dodaj opcje języków
    i18n.getAvailableLanguages().forEach(lang => {
      const option = document.createElement('option');
      option.value = lang.code;
      option.textContent = `${lang.nativeName} (${lang.name})`;
      this.selectElement.appendChild(option);
    });
    
    wrapper.appendChild(label);
    wrapper.appendChild(this.selectElement);
    
    this.container.appendChild(wrapper);
  }

  private setupEventListeners(): void {
    this.selectElement.addEventListener('change', (e) => {
      const target = e.target as HTMLSelectElement;
      const newLanguage = target.value as Language;
      
      i18n.setLanguage(newLanguage);
      this.updateAllTexts();
    });

    // Nasłuchuj zmiany języka z innych miejsc
    window.addEventListener('languageChanged', () => {
      this.updateCurrentSelection();
      this.updateAllTexts();
    });
  }

  private updateCurrentSelection(): void {
    this.selectElement.value = i18n.getCurrentLanguage();
  }

  private updateAllTexts(): void {
    // Aktualizuj label selectora
    const label = this.container.querySelector('label');
    if (label) {
      label.textContent = i18n.t('settings.language');
    }

    // Wyślij event do reszty aplikacji
    window.dispatchEvent(new CustomEvent('updateTranslations'));
  }

  public destroy(): void {
    const selector = this.container.querySelector('.language-selector');
    if (selector) {
      this.container.removeChild(selector);
    }
  }
}

// Helper function do łatwego dodawania w różnych miejscach
export function createLanguageSelector(containerId: string): LanguageSelector {
  return new LanguageSelector(containerId);
}