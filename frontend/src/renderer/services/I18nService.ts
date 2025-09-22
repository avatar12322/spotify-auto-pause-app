import { translations, Language, TranslationKey, availableLanguages } from '../../locales/types';
import { AppConfig } from '../../types/api.types'; // DODANY IMPORT

class I18nService {
  private currentLanguage: Language = 'en'; // domyślny język

  constructor() {
    this.loadLanguageFromConfig();
  }

  private async loadLanguageFromConfig(): Promise<void> {
    try {
      const config: AppConfig = await window.electronAPI.getConfig();
      this.currentLanguage = config.language || 'en';
    } catch (error) {
      console.warn('Could not load language from config, using default');
    }
  }

  public setLanguage(language: Language): void {
    this.currentLanguage = language;
    this.saveLanguageToConfig(language);
    
    // Emit event dla innych komponentów
    window.dispatchEvent(new CustomEvent('languageChanged', { 
      detail: { language } 
    }));
  }

  private async saveLanguageToConfig(language: Language): Promise<void> {
    try {
      const config: AppConfig = await window.electronAPI.getConfig();
      config.language = language;
      await window.electronAPI.saveConfig(config);
    } catch (error) {
      console.error('Could not save language to config:', error);
    }
  }

  public getCurrentLanguage(): Language {
    return this.currentLanguage;
  }

  public getAvailableLanguages() {
    return availableLanguages;
  }

  // Type-safe translation function
  public t(key: string): string {
    const keys = key.split('.');
    let value: any = translations[this.currentLanguage];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        console.warn(`Translation key not found: ${key} for language ${this.currentLanguage}`);
        
        // Fallback do angielskiego
        value = translations['en'];
        for (const fallbackKey of keys) {
          if (value && typeof value === 'object' && fallbackKey in value) {
            value = value[fallbackKey];
          } else {
            return `[${key}]`; // Pokazuj klucz jeśli nie ma tłumaczenia
          }
        }
        break;
      }
    }
    
    return typeof value === 'string' ? value : `[${key}]`;
  }

  // Helper do interpolacji zmiennych
  public ti(key: string, variables: Record<string, string | number>): string {
    let text = this.t(key);
    
    Object.entries(variables).forEach(([variable, value]) => {
      text = text.replace(`{{${variable}}}`, String(value));
    });
    
    return text;
  }

  // Helper do tłumaczenia tablic
  public tArray(key: string): string[] {
    const keys = key.split('.');
    let value: any = translations[this.currentLanguage];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return [];
      }
    }
    
    return Array.isArray(value) ? value : [];
  }
}

export const i18n = new I18nService();