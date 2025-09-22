import { i18n } from './I18nService';

export class I18nDomHelper {
  
  // Aktualizuje wszystkie elementy z data-i18n
  public static updateAllTranslations(): void {
    // Elementy z textContent
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      if (key) {
        element.textContent = i18n.t(key);
      }
    });

    // Elementy z placeholder
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
      const key = element.getAttribute('data-i18n-placeholder');
      if (key && element instanceof HTMLInputElement) {
        element.placeholder = i18n.t(key);
      }
    });

    // Elementy z title
    document.querySelectorAll('[data-i18n-title]').forEach(element => {
      const key = element.getAttribute('data-i18n-title');
      if (key) {
        element.setAttribute('title', i18n.t(key));
      }
    });

    // Aktualizuj lang attribute
    document.documentElement.lang = i18n.getCurrentLanguage();

    // Aktualizuj title strony
    const titleElement = document.querySelector('title[data-i18n]');
    if (titleElement) {
      const key = titleElement.getAttribute('data-i18n');
      if (key) {
        document.title = i18n.t(key);
      }
    }

    // Specjalne przypadki - listy z tłumaczeniami
    I18nDomHelper.updateSpecialElements();
  }

  // Specjalne elementy które wymagają dynamicznego tworzenia
  private static updateSpecialElements(): void {
    // Step 1 instructions
    const step1Instructions = document.getElementById('step1Instructions');
    if (step1Instructions) {
      step1Instructions.innerHTML = '';
      i18n.tArray('setup.step1.steps').forEach(step => {
        const li = document.createElement('li');
        li.textContent = step;
        step1Instructions.appendChild(li);
      });
    }

    // Success info w step 4
    const successInfo = document.getElementById('successInfo');
    if (successInfo) {
      successInfo.innerHTML = '';
      i18n.tArray('setup.step4.successItems').forEach(item => {
        const div = document.createElement('div');
        div.className = 'success-item';
        
        const icon = document.createElement('span');
        icon.className = 'success-icon';
        icon.textContent = '✅';
        
        const text = document.createElement('span');
        text.textContent = item;
        
        div.appendChild(icon);
        div.appendChild(text);
        successInfo.appendChild(div);
      });
    }
  }

  // Inicjalizuj system po załadowaniu DOM
  public static initialize(): void {
    // Aktualizuj przy pierwszym załadowaniu
    I18nDomHelper.updateAllTranslations();

    // Nasłuchuj zmiany języka
    window.addEventListener('languageChanged', () => {
      I18nDomHelper.updateAllTranslations();
    });

    // Nasłuchuj custom event dla aktualizacji
    window.addEventListener('updateTranslations', () => {
      I18nDomHelper.updateAllTranslations();
    });
  }

  // Helper do dynamicznego dodawania tłumaczonych elementów
  public static createTranslatedElement(tag: string, i18nKey: string, className?: string): HTMLElement {
    const element = document.createElement(tag);
    element.textContent = i18n.t(i18nKey);
    element.setAttribute('data-i18n', i18nKey);
    if (className) {
      element.className = className;
    }
    return element;
  }

  // Helper do tworzenia tłumaczonego przycisku
  public static createTranslatedButton(i18nKey: string, className?: string, icon?: string): HTMLButtonElement {
    const button = document.createElement('button');
    if (className) {
      button.className = className;
    }
    
    if (icon) {
      const iconSpan = document.createElement('span');
      iconSpan.textContent = icon;
      button.appendChild(iconSpan);
      button.appendChild(document.createTextNode(' '));
    }
    
    const textSpan = document.createElement('span');
    textSpan.textContent = i18n.t(i18nKey);
    textSpan.setAttribute('data-i18n', i18nKey);
    button.appendChild(textSpan);
    
    return button;
  }
}