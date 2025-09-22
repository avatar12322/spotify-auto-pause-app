import { SetupElements, SpotifyConfig } from '../../types/api.types';

export class SetupManager {
  private elements: SetupElements;
  private authCheckInterval: number | null = null;

  constructor() {
    this.elements = this.initializeElements();
    this.validateInputs();
  }

  private initializeElements(): SetupElements {
    return {
      clientIdInput: document.getElementById('clientId') as HTMLInputElement,
      clientSecretInput: document.getElementById('clientSecret') as HTMLInputElement,
      redirectUriInput: document.getElementById('redirectUri') as HTMLInputElement,
      authorizeBtn: document.getElementById('authorizeSpotify'),
      authStatus: document.getElementById('authStatus')
    };
  }

  setupEventListeners(): void {
    // Input validation
    [this.elements.clientIdInput, this.elements.clientSecretInput].forEach(input => {
      input?.addEventListener('input', () => {
        this.validateInputs();
      });
    });

    // Toggle password visibility
    document.getElementById('toggleSecret')?.addEventListener('click', () => {
      this.togglePasswordVisibility();
    });

    // Authorize button
    this.elements.authorizeBtn?.addEventListener('click', () => {
      this.startSpotifyAuthorization();
    });

    // Finish setup button
    document.getElementById('finishSetup')?.addEventListener('click', () => {
      this.finishSetup();
    });

    // Error modal handlers
    document.getElementById('closeError')?.addEventListener('click', () => {
      this.hideModal('errorModal');
    });

    document.getElementById('retryAuth')?.addEventListener('click', () => {
      this.hideModal('errorModal');
      this.startSpotifyAuthorization();
    });
  }

  private validateInputs(): void {
    const clientId = this.elements.clientIdInput?.value.trim() || '';
    const clientSecret = this.elements.clientSecretInput?.value.trim() || '';
    
    const isValid = clientId.length > 0 && clientSecret.length > 0;
    
    if (this.elements.authorizeBtn) {
      if (isValid) {
        this.elements.authorizeBtn.removeAttribute('disabled');
      } else {
        this.elements.authorizeBtn.setAttribute('disabled', 'true');
      }
    }

    if (this.elements.authStatus) {
      const statusIcon = this.elements.authStatus.querySelector('.status-icon');
      const statusText = this.elements.authStatus.querySelector('.status-text');
      
      if (isValid) {
        if (statusIcon) statusIcon.textContent = '✅';
        if (statusText) statusText.textContent = 'Gotowe do autoryzacji';
      } else {
        if (statusIcon) statusIcon.textContent = '⏳';
        if (statusText) statusText.textContent = 'Wprowadź dane aplikacji powyżej';
      }
    }
  }

  private togglePasswordVisibility(): void {
    const toggle = document.getElementById('toggleSecret');
    if (this.elements.clientSecretInput && toggle) {
      if (this.elements.clientSecretInput.type === 'password') {
        this.elements.clientSecretInput.type = 'text';
        toggle.textContent = '🙈';
      } else {
        this.elements.clientSecretInput.type = 'password';
        toggle.textContent = '👁️';
      }
    }
  }

  private async startSpotifyAuthorization(): Promise<void> {
    const clientId = this.elements.clientIdInput?.value.trim();
    const clientSecret = this.elements.clientSecretInput?.value.trim();
    const redirectUri = this.elements.redirectUriInput?.value.trim();

    if (!clientId || !clientSecret || !redirectUri) {
      this.showError('Wszystkie pola są wymagane');
      return;
    }

    try {
      this.showModal('loadingModal');
      
      // Krok 1: Zapisz dane Spotify do backendu
      const spotifyConfig = {
        clientId,
        clientSecret,
        redirectUri
      };

      console.log('Saving Spotify config...');
      const saveResponse = await window.electronAPI.apiRequest('POST', '/api/config/spotify', spotifyConfig);
      
      if (!saveResponse.success) {
        throw new Error(saveResponse.error || 'Failed to save Spotify config');
      }

      // Krok 2: Pobierz URL autoryzacji
      console.log('Getting authorization URL...');
      const authUrlResponse = await window.electronAPI.apiRequest('GET', '/api/auth/spotify/url');

      console.log('Authorization URL response:', authUrlResponse);
      console.log('URL data type:', typeof authUrlResponse.data);
      console.log('URL data value:', authUrlResponse.data);

      // Wyciągnij właściwy URL z zagnieżdżonej struktury
      let actualUrl = authUrlResponse.data;
      if (actualUrl && actualUrl.data) {
        actualUrl = actualUrl.data; // To jest właściwy URL string
      }

      const authUrl = String(actualUrl || '');
      console.log('Extracted URL:', authUrl);

      if (!authUrl || authUrl === 'undefined' || authUrl.startsWith('[object')) {
        throw new Error('Invalid authorization URL received');
      }

      console.log('Converted URL:', authUrl);
      
      if (!authUrlResponse.success) {
        throw new Error(authUrlResponse.error || 'Failed to get authorization URL');
      }

      this.hideModal('loadingModal');

      // Krok 3: Otwórz przeglądarkę z URL autoryzacji
      console.log('About to call openExternal with:', authUrl, typeof authUrl);
      await window.electronAPI.openExternal(authUrl);

      // Pokaż informację o oczekiwaniu na autoryzację
      this.showAuthorizationPending();

    } catch (error) {
      this.hideModal('loadingModal');
      console.error('Authorization error:', error);
      this.showError('Błąd podczas autoryzacji: ' + error);
    }
  }

  private showAuthorizationPending(): void {
    if (this.elements.authStatus) {
      const statusIcon = this.elements.authStatus.querySelector('.status-icon');
      const statusText = this.elements.authStatus.querySelector('.status-text');
      
      if (statusIcon) statusIcon.textContent = '⏳';
      if (statusText) statusText.textContent = 'Oczekiwanie na autoryzację w przeglądarce...';
    }

    // Pokaż instrukcje
    const instructions = document.createElement('div');
    instructions.className = 'auth-instructions';
    instructions.innerHTML = `
      <div style="background: #1a1a1a; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #1DB954;">
        <h4 style="color: #1DB954; margin: 0 0 10px 0;">Instrukcje:</h4>
        <ol style="color: #ccc; margin: 0; padding-left: 20px;">
          <li>Zaloguj się do swojego konta Spotify w otwartej przeglądarce</li>
          <li>Kliknij "Agree" aby autoryzować aplikację</li>
          <li>Przeglądarka przekieruje Cię z powrotem do aplikacji</li>
          <li>Gdy autoryzacja się powiedzie, status automatycznie się zmieni</li>
        </ol>
        <p style="color: #888; margin: 10px 0 0 0; font-size: 12px;">
          Jeśli przeglądarka się nie otworzyła, skopiuj link z terminala backendu.
        </p>
      </div>
    `;

    // Dodaj instrukcje po przycisku autoryzacji
    const authorizeBtn = this.elements.authorizeBtn;
    if (authorizeBtn && authorizeBtn.parentNode) {
      authorizeBtn.parentNode.insertBefore(instructions, authorizeBtn.nextSibling);
    }

    // Pokaż przycisk "Zakończ setup"
    this.showStep4();

    // Automatyczne sprawdzanie statusu autoryzacji co 2 sekundy
    this.authCheckInterval = window.setInterval(async () => {
      console.log('Checking authorization status...');
      const isAuthorized = await this.checkAuthorizationStatus();
      
      if (isAuthorized) {
        console.log('Authorization completed successfully!');
        this.stopAuthorizationCheck();
        
        // Usuń instrukcje oczekiwania
        const instructions = document.querySelector('.auth-instructions');
        if (instructions) {
          instructions.remove();
        }
        
        // Pokaż komunikat sukcesu
        const successMessage = document.createElement('div');
        successMessage.className = 'auth-success';
        successMessage.innerHTML = `
          <div style="background: #1a4d2a; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #1DB954;">
            <h4 style="color: #1DB954; margin: 0 0 10px 0;">✅ Autoryzacja zakończona pomyślnie!</h4>
            <p style="color: #ccc; margin: 0;">Możesz teraz kliknąć "Zakończ setup" poniżej.</p>
          </div>
        `;
        
        const authorizeBtn = this.elements.authorizeBtn;
        if (authorizeBtn && authorizeBtn.parentNode) {
          authorizeBtn.parentNode.insertBefore(successMessage, authorizeBtn.nextSibling);
        }
      }
    }, 2000); // Sprawdzaj co 2 sekundy
    
    // Zatrzymaj sprawdzanie po 5 minutach
    setTimeout(() => {
      this.stopAuthorizationCheck();
      console.log('Authorization check timeout after 5 minutes');
    }, 300000);
  }

  private stopAuthorizationCheck(): void {
    if (this.authCheckInterval) {
      clearInterval(this.authCheckInterval);
      this.authCheckInterval = null;
    }
  }

  private async checkAuthorizationStatus(): Promise<boolean> {
  try {
    const statusResponse = await window.electronAPI.apiRequest('GET', '/api/auth/spotify/status');
    
    console.log('Auth status response:', statusResponse);
    
    // Sprawdź czy to zagnieżdżona struktura
    let statusData = statusResponse.data;
    if (statusData && statusData.success !== undefined && statusData.data !== undefined) {
      statusData = statusData.data;
    }
    
    const hasToken = statusResponse.success && statusData && (
      statusData.hasRefreshToken || 
      statusData.hasAccessToken || 
      statusData.isAuthenticated
    );
    
    console.log('Authorization check result:', {
      success: statusResponse.success,
      hasToken,
      statusData
    });
    
    if (hasToken) {
      // Aktualizuj UI
      if (this.elements.authStatus) {
        const statusIcon = this.elements.authStatus.querySelector('.status-icon');
        const statusText = this.elements.authStatus.querySelector('.status-text');
        
        if (statusIcon) statusIcon.textContent = '✅';
        if (statusText) statusText.textContent = 'Autoryzacja zakończona pomyślnie!';
      }
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking authorization status:', error);
    return false;
  }
}

  private async finishSetup(): Promise<void> {
  try {
    console.log('Starting finish setup process...');
    
    // Sprawdź czy autoryzacja została zakończona
    const isAuthorized = await this.checkAuthorizationStatus();
    
    if (!isAuthorized) {
      this.showError('Autoryzacja Spotify nie została jeszcze zakończona. Sprawdź przeglądarkę i dokończ proces autoryzacji.');
      return;
    }

    // Zatrzymaj sprawdzanie autoryzacji
    this.stopAuthorizationCheck();

    // Przygotuj konfigurację
    const config = {
      clientId: this.elements.clientIdInput?.value.trim() || '',
      clientSecret: this.elements.clientSecretInput?.value.trim() || '',
      redirectUri: this.elements.redirectUriInput?.value.trim() || ''
    };

    console.log('Completing setup with config:', { 
      clientId: config.clientId.substring(0, 8) + '...', 
      hasSecret: !!config.clientSecret,
      redirectUri: config.redirectUri 
    });

    // Wywołaj complete setup
    const response = await window.electronAPI.completeSetup(config);
    
    if (response.success) {
      console.log('Setup completed successfully from frontend');
      
      // Dodatkowe wywołanie odświeżenia (backup)
      setTimeout(async () => {
        console.log('Calling refresh main window as backup...');
        await window.electronAPI.refreshMainWindow();
      }, 1000);
      
    } else {
      console.error('Setup completion failed:', response.error);
      this.showError(response.error || 'Nie udało się ukończyć konfiguracji');
    }
  } catch (error) {
    console.error('Error in finishSetup:', error);
    this.showError('Błąd podczas kończenia setup: ' + error);
  }
}

  private showStep4(): void {
    const step4 = document.getElementById('step4');
    if (step4) {
      step4.style.display = 'block';
      step4.scrollIntoView({ behavior: 'smooth' });
    }
  }

  private showModal(modalId: string): void {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = 'flex';
    }
  }

  private hideModal(modalId: string): void {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = 'none';
    }
  }

  private showError(message: string): void {
    const errorModal = document.getElementById('errorModal');
    const errorMessage = document.getElementById('errorMessage');
    
    if (errorMessage) {
      errorMessage.textContent = message;
    }
    
    this.showModal('errorModal');
  }

  // Cleanup metoda do zatrzymania sprawdzania przy zamykaniu
  public destroy(): void {
    this.stopAuthorizationCheck();
  }
}