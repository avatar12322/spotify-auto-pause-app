export const pl = {
  app: {
    title: "Spotify Auto-Pause",
    subtitle: "Automatyczne pauzowanie Spotify"
  },
  status: {
    inactive: "Nieaktywny",
    active: "Aktywny",
    stopped: "Zatrzymany",
    ready: "Gotowy",
    notConfigured: "Nie skonfigurowany"
  },
  buttons: {
    startMonitoring: "Uruchom monitoring",
    stopMonitoring: "Zatrzymaj monitoring",
    openPanel: "Otwórz panel",
    addManually: "Dodaj ręcznie",
    selectFromProcesses: "Wybierz z uruchomionych",
    clear: "Wyczyść",
    refresh: "Odśwież",
    cancel: "Anuluj",
    add: "Dodaj",
    save: "Zapisz",
    close: "Zamknij",
    retry: "Spróbuj ponownie",
    finish: "Zakończ",
    authorize: "Autoryzuj ze Spotify",
    launchApp: "Uruchom aplikację",
    openSpotifyDashboard: "Otwórz Spotify Developer Dashboard"
  },
  settings: {
    quickSettings: "Szybkie ustawienia",
    detectionThreshold: "Próg wykrywania dźwięku:",
    silenceTime: "Czas ciszy przed wznowieniem (s):",
    excludedApps: "Wykluczone aplikacje",
    language: "Język",
    thresholdNote: "Niższe wartości = bardziej wrażliwy na ciche dźwięki"
  },
  setup: {
    title: "Pierwsza konfiguracja - połącz ze Spotify",
    step1: {
      title: "Stwórz aplikację Spotify",
      description: "Potrzebujesz konta Spotify Developer, aby aplikacja mogła kontrolować odtwarzanie.",
      instructions: "Instrukcje:",
      steps: [
        "Zaloguj się na https://developer.spotify.com/dashboard/",
        "Kliknij \"Create app\"",
        "Nazwij aplikację np. \"Auto Pause\"",
        "Opis: \"Personal audio management\"",
        "Jako Redirect URI ustaw: http://127.0.0.1:5098/api/auth/spotify/callback",
        "Zaznacz \"Web API\" i zapisz"
      ]
    },
    step2: {
      title: "Wprowadź dane aplikacji",
      description: "Skopiuj Client ID i Client Secret z utworzonej aplikacji Spotify.",
      clientId: "Client ID:",
      clientSecret: "Client Secret:",
      redirectUri: "Redirect URI:",
      uriNote: "Ta wartość jest prawidłowa - nie zmieniaj jej",
      clientIdPlaceholder: "Wklej Client ID...",
      clientSecretPlaceholder: "Wklej Client Secret..."
    },
    step3: {
      title: "Autoryzacja ze Spotify",
      description: "Połącz aplikację z Twoim kontem Spotify, aby umożliwić kontrolę odtwarzania.",
      waiting: "Oczekiwanie na autoryzację w przeglądarce...",
      completed: "Autoryzacja zakończona pomyślnie!",
      enterData: "Wprowadź dane aplikacji powyżej",
      readyToAuth: "Gotowe do autoryzacji",
      instructions: {
        title: "Instrukcje:",
        steps: [
          "Zaloguj się do swojego konta Spotify w otwartej przeglądarce",
          "Kliknij \"Agree\", aby autoryzować aplikację",
          "Przeglądarka przekieruje Cię z powrotem do aplikacji",
          "Gdy autoryzacja się powiedzie, status automatycznie się zmieni"
        ],
        note: "Jeśli przeglądarka się nie otworzyła, skopiuj link z terminala backendu."
      }
    },
    step4: {
      title: "Konfiguracja zakończona!",
      description: "Wszystko gotowe. Aplikacja może teraz automatycznie pauzować Spotify.",
      successItems: [
        "Połączono ze Spotify",
        "Konfiguracja zapisana",
        "Gotowa do użycia"
      ]
    }
  },
  logs: {
    title: "Logi aktywności",
    appStarted: "Aplikacja uruchomiona"
  },
  modals: {
    addApp: {
      title: "Dodaj aplikację do wykluczenia",
      placeholder: "np. chrome, discord, game.exe"
    },
    error: {
      title: "Wystąpił błąd",
      connectionFailed: "Nie udało się połączyć ze Spotify.",
      authIncomplete: "Autoryzacja Spotify nie została jeszcze zakończona. Sprawdź przeglądarkę i dokończ proces autoryzacji.",
      configFailed: "Nie udało się zaktualizować konfiguracji",
      processesFailed: "Błąd podczas ładowania procesów"
    },
    loading: {
      title: "Łączenie ze Spotify...",
      description: "Poczekaj, trwa autoryzacja z Twoim kontem Spotify."
    }
  },
  footer: {
    spotifyConfig: "Konfiguracja Spotify",
    resetConfig: "Reset konfiguracji",
    version: "Made with ❤️"
  },
  tray: {
    exit: "Zamknij",
    configure: "Konfiguruj",
    reconfigure: "Rekonfiguruj",
    spotifyDashboard: "Spotify Dashboard"
  },
  help: {
    needHelp: "Potrzebujesz pomocy?",
    premiumInfo: "Informacje o wymaganiach Premium"
  },
  messages: {
    lastActivity: "Ostatnia aktywność:",
    currentStatus: "Status:",
    appAlreadyExcluded: "Ta aplikacja jest już wykluczona",
    confirmReset: "Czy na pewno chcesz zresetować konfigurację Spotify? Będziesz musiał ponownie autoryzować aplikację.",
    resetFailed: "Nie udało się zresetować konfiguracji. Spróbuj ponownie.",
    noProcesses: "Nie znaleziono aktywnych procesów audio"
  }
};
