import { DOMElements, MonitoringStatus, LogEntry } from '../../types/api.types';

interface ThresholdPreset {
  value: number;
  label: string;
  description: string;
}

export class UIManager {
  private elements: DOMElements;
  private thresholdPresets: ThresholdPreset[] = [
    { value: 0.005, label: "0.5%", description: "Bardzo wrażliwy - wykryje szept" },
    { value: 0.01, label: "1%", description: "Wrażliwy - wykryje cichą muzykę" },
    { value: 0.02, label: "2%", description: "Normalny - zalecany" },
    { value: 0.05, label: "5%", description: "Mniej wrażliwy" },
    { value: 0.1, label: "10%", description: "Najmniej wrażliwy - tylko głośne dźwięki" }
  ];

  constructor() {
    this.elements = this.initializeElements();
    this.setupThresholdPresets();
  }

  private initializeElements(): DOMElements {
    return {
      statusIndicator: document.getElementById('statusIndicator'),
      toggleBtn: document.getElementById('toggleBtn'),
      currentStatusEl: document.getElementById('currentStatus'),
      lastActivityEl: document.getElementById('lastActivity'),
      thresholdSlider: document.getElementById('threshold') as HTMLInputElement,
      thresholdValue: document.getElementById('thresholdValue'),
      silenceSlider: document.getElementById('silenceTime') as HTMLInputElement,
      silenceValue: document.getElementById('silenceTimeValue'),
      excludedAppsEl: document.getElementById('excludedApps'),
      logsContainer: document.getElementById('logsContainer')
    };
  }

  private setupThresholdPresets(): void {
    const presetsContainer = document.querySelector('.preset-buttons');
    if (!presetsContainer) {
      // Jeśli nie ma kontenera, stwórz go
      this.createThresholdPresetsUI();
      return;
    }

    // Dodaj event listenery do istniejących przycisków
    presetsContainer.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('preset-btn')) {
        const value = parseFloat(target.dataset.value || '0.02');
        this.setThresholdValue(value);
      }
    });
  }

  private createThresholdPresetsUI(): void {
    const thresholdGroup = this.elements.thresholdSlider?.closest('.setting-group');
    if (!thresholdGroup) return;

    // Stwórz kontener dla przycisków preset
    const presetsContainer = document.createElement('div');
    presetsContainer.className = 'preset-buttons';
    
    this.thresholdPresets.forEach(preset => {
      const button = document.createElement('button');
      button.className = 'preset-btn';
      button.dataset.value = preset.value.toString();
      button.textContent = preset.label;
      button.title = preset.description;
      
      if (preset.value === 0.02) { // domyślny
        button.classList.add('active');
      }
      
      presetsContainer.appendChild(button);
    });

    // Dodaj event listener
    presetsContainer.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('preset-btn')) {
        const value = parseFloat(target.dataset.value || '0.02');
        this.setThresholdValue(value);
        
        // Aktualizuj aktywny przycisk
        presetsContainer.querySelectorAll('.preset-btn').forEach(btn => 
          btn.classList.remove('active'));
        target.classList.add('active');
      }
    });

    // Wstaw po sliderze
    const rangeContainer = thresholdGroup.querySelector('.range-container');
    if (rangeContainer) {
      rangeContainer.parentNode?.insertBefore(presetsContainer, rangeContainer.nextSibling);
    }
  }

  private setThresholdValue(value: number): void {
    if (this.elements.thresholdSlider) {
      this.elements.thresholdSlider.value = value.toString();
      this.updateThresholdDisplay();
      
      // Wywołaj event żeby aplikacja zaktualizowała ustawienia
      const event = new Event('change');
      this.elements.thresholdSlider.dispatchEvent(event);
    }
  }

  private updateThresholdDisplay(): void {
    if (this.elements.thresholdSlider && this.elements.thresholdValue) {
      const value = parseFloat(this.elements.thresholdSlider.value);
      const percentage = (value * 100).toFixed(1);
      this.elements.thresholdValue.textContent = `${percentage}%`;
    }
  }

  getElements(): DOMElements {
    return this.elements;
  }

  updateStatus(status: MonitoringStatus): void {
    this.updateStatusIndicator(status.isRunning);
    this.updateToggleButton(status.isRunning);
    this.updateStatusText(status.isRunning);
    this.updateLastActivity(status.lastActivity);
    this.updateSliders(status.currentThreshold, status.silenceRequired);
    this.updateExcludedApps(status.excludedApps);
  }

  private updateStatusIndicator(isRunning: boolean): void {
    if (!this.elements.statusIndicator) return;

    const statusDot = this.elements.statusIndicator.querySelector('.status-dot') as HTMLElement;
    const statusText = this.elements.statusIndicator.querySelector('.status-text') as HTMLElement;
    
    if (isRunning) {
      if (statusDot) statusDot.className = 'status-dot active';
      if (statusText) statusText.textContent = 'Aktywny';
      this.elements.statusIndicator.className = 'status-indicator active';
    } else {
      if (statusDot) statusDot.className = 'status-dot';
      if (statusText) statusText.textContent = 'Nieaktywny';
      this.elements.statusIndicator.className = 'status-indicator';
    }
  }

  private updateToggleButton(isRunning: boolean): void {
    if (!this.elements.toggleBtn) return;

    const btnIcon = this.elements.toggleBtn.querySelector('.btn-icon') as HTMLElement;
    const btnText = this.elements.toggleBtn.querySelector('.btn-text') as HTMLElement;
    
    if (isRunning) {
      if (btnIcon) btnIcon.textContent = '⏸';
      if (btnText) btnText.textContent = 'Zatrzymaj monitoring';
      this.elements.toggleBtn.className = 'toggle-btn active';
    } else {
      if (btnIcon) btnIcon.textContent = '▶';
      if (btnText) btnText.textContent = 'Uruchom monitoring';
      this.elements.toggleBtn.className = 'toggle-btn';
    }
  }

  private updateStatusText(isRunning: boolean): void {
    if (this.elements.currentStatusEl) {
      this.elements.currentStatusEl.textContent = isRunning ? 'Uruchomiony' : 'Zatrzymany';
    }
  }

  private updateLastActivity(lastActivity?: string): void {
    if (this.elements.lastActivityEl) {
      this.elements.lastActivityEl.textContent = lastActivity || '-';
    }
  }

  private updateSliders(threshold: number, silenceTime: number): void {
    if (this.elements.thresholdSlider && this.elements.thresholdValue) {
      const thresholdValue = threshold !== null && threshold !== undefined ? threshold : 0.02;
      this.elements.thresholdSlider.value = thresholdValue.toString();
      
      // Wyświetl jako procent
      const percentage = (thresholdValue * 100).toFixed(1);
      this.elements.thresholdValue.textContent = `${percentage}%`;
      
      // Aktualizuj aktywny preset button
      this.updateActivePresetButton(thresholdValue);
    }

    if (this.elements.silenceSlider && this.elements.silenceValue) {
      const silenceValue = silenceTime !== null && silenceTime !== undefined ? silenceTime : 2.0;
      this.elements.silenceSlider.value = silenceValue.toString();
      this.elements.silenceValue.textContent = `${silenceValue}s`;
    }
  }

  private updateActivePresetButton(currentValue: number): void {
    const presetsContainer = document.querySelector('.preset-buttons');
    if (!presetsContainer) return;

    // Usuń active z wszystkich przycisków
    presetsContainer.querySelectorAll('.preset-btn').forEach(btn => 
      btn.classList.remove('active'));

    // Znajdź najbliższy preset
    const closestPreset = this.thresholdPresets.reduce((prev, curr) => 
      Math.abs(curr.value - currentValue) < Math.abs(prev.value - currentValue) ? curr : prev
    );

    // Zaznacz odpowiedni przycisk jako aktywny
    const activeBtn = presetsContainer.querySelector(`[data-value="${closestPreset.value}"]`);
    if (activeBtn) {
      activeBtn.classList.add('active');
    }
  }

  private async showProcessSelector(): Promise<void> {
  try {
    const response = await window.electronAPI.apiRequest('GET', '/api/monitoring/processes');
    
    if (response.success) {
      this.createProcessSelectorModal(response.data);
    }
  } catch (error) {
    console.error('Error loading processes:', error);
  }
}

createProcessSelectorModal(processes: any[]): void {
  const modal = document.createElement('div');
  modal.className = 'modal process-selector-modal';
  modal.innerHTML = `
    <div class="modal-content">
      <h3>Wybierz aplikacje do wykluczenia</h3>
      <div class="process-list">
        ${processes.map(proc => `
          <div class="process-item">
            <label>
              <input type="checkbox" value="${proc.processName}">
              <span class="process-name">${proc.displayName}</span>
              ${proc.hasAudio ? '<span class="audio-indicator">🔊</span>' : ''}
            </label>
          </div>
        `).join('')}
      </div>
      <div class="modal-actions">
        <button class="btn-primary" id="confirmProcessSelection">Dodaj wybrane</button>
        <button class="btn-secondary" id="cancelProcessSelection">Anuluj</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  modal.style.display = 'flex';

  // Event listeners
  modal.querySelector('#confirmProcessSelection')?.addEventListener('click', () => {
    this.addSelectedProcesses(modal);
  });

  modal.querySelector('#cancelProcessSelection')?.addEventListener('click', () => {
    modal.remove();
  });
}

private addSelectedProcesses(modal: HTMLElement): void {
  const checkboxes = modal.querySelectorAll('input[type="checkbox"]:checked');
  const selectedApps = Array.from(checkboxes).map(cb => (cb as HTMLInputElement).value);
  
  if (selectedApps.length > 0) {
    // Tutaj dodaj logikę do aktualizacji listy wykluczonych aplikacji
    console.log('Selected apps:', selectedApps);
  }
  
  modal.remove();
}

  updateExcludedApps(excludedApps: string[]): void {
    if (!this.elements.excludedAppsEl) return;

    // Dodaj sprawdzenie czy excludedApps istnieje i jest tablicą
    if (!excludedApps || !Array.isArray(excludedApps)) {
      console.warn('excludedApps is not an array:', excludedApps);
      return;
    }

    // Clear existing tags
    const existingTags = this.elements.excludedAppsEl.querySelectorAll('.app-tag');
    existingTags.forEach(tag => tag.remove());

    // Add current excluded apps
    excludedApps.forEach(app => {
      const tag = document.createElement('span');
      tag.className = 'app-tag';
      tag.innerHTML = `
        ${app}
        <button class="remove-app" data-app="${app}">×</button>
      `;
      
      this.elements.excludedAppsEl!.appendChild(tag);
    });
  }

  updateLogs(logs: LogEntry[]): void {
    if (!this.elements.logsContainer) {
      console.warn('Logs container not found');
      return;
    }

    // Clear existing logs
    this.elements.logsContainer.innerHTML = '';

    // Show recent logs (last 20)
    const recentLogs = logs.slice(-20).reverse();
    
    if (recentLogs.length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'log-entry info';
      emptyMessage.innerHTML = `
        <span class="log-time">--:--:--</span>
        <span class="log-message">Brak logów</span>
      `;
      this.elements.logsContainer.appendChild(emptyMessage);
      return;
    }

    recentLogs.forEach(log => {
      const logElement = document.createElement('div');
      logElement.className = `log-entry ${log.level}`;
      logElement.innerHTML = `
        <span class="log-time">${log.timestamp}</span>
        <span class="log-message">${this.escapeHtml(log.message)}</span>
      `;
      this.elements.logsContainer!.appendChild(logElement);
    });
  }

  showModal(modalId: string): void {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = 'flex';
    }
  }

  hideModal(modalId: string): void {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = 'none';
    }
  }

  showError(message: string): void {
    const errorModal = document.getElementById('errorModal');
    const errorMessage = document.getElementById('errorMessage');
    
    if (errorMessage) {
      errorMessage.textContent = message;
    }
    
    this.showModal('errorModal');
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}