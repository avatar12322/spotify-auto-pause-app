export const en = {
  app: {
    title: "Spotify Auto-Pause",
    subtitle: "Automatic Spotify pausing"
  },
  status: {
    inactive: "Inactive",
    active: "Active",
    stopped: "Stopped",
    ready: "Ready",
    notConfigured: "Not Configured"
  },
  buttons: {
    startMonitoring: "Start monitoring",
    stopMonitoring: "Stop monitoring",
    openPanel: "Open panel",
    addManually: "Add manually",
    selectFromProcesses: "Select from running",
    clear: "Clear",
    refresh: "Refresh",
    cancel: "Cancel",
    add: "Add",
    save: "Save",
    close: "Close",
    retry: "Retry",
    finish: "Finish",
    authorize: "Authorize with Spotify",
    launchApp: "Launch application",
    openSpotifyDashboard: "Open Spotify Developer Dashboard"
  },
  settings: {
    quickSettings: "Quick settings",
    detectionThreshold: "Audio detection threshold:",
    silenceTime: "Silence time before resume (s):",
    excludedApps: "Excluded applications",
    language: "Language",
    thresholdNote: "Lower values = more sensitive to quiet sounds"
  },
  setup: {
    title: "Initial setup - connect to Spotify",
    step1: {
      title: "Create Spotify application",
      description: "You need a Spotify Developer account so the app can control playback.",
      instructions: "Instructions:",
      steps: [
        "Log in to https://developer.spotify.com/dashboard/",
        "Click \"Create app\"",
        "Name the app e.g. \"Auto Pause\"",
        "Description: \"Personal audio management\"",
        "Set Redirect URI to: http://127.0.0.1:5098/api/auth/spotify/callback",
        "Check \"Web API\" and save"
      ]
    },
    step2: {
      title: "Enter application details",
      description: "Copy the Client ID and Client Secret from your created Spotify app.",
      clientId: "Client ID:",
      clientSecret: "Client Secret:",
      redirectUri: "Redirect URI:",
      uriNote: "This value is correct - don't change it",
      clientIdPlaceholder: "Paste Client ID...",
      clientSecretPlaceholder: "Paste Client Secret..."
    },
    step3: {
      title: "Spotify authorization",
      description: "Connect the app to your Spotify account to enable playback control.",
      waiting: "Waiting for authorization in browser...",
      completed: "Authorization completed successfully!",
      enterData: "Enter app details above",
      readyToAuth: "Ready for authorization",
      instructions: {
        title: "Instructions:",
        steps: [
          "Log in to your Spotify account in the opened browser",
          "Click \"Agree\" to authorize the application",
          "The browser will redirect you back to the app",
          "When authorization succeeds, the status will update automatically"
        ],
        note: "If the browser didn't open, copy the link from the backend terminal."
      }
    },
    step4: {
      title: "Configuration complete!",
      description: "All set. The app can now automatically pause Spotify.",
      successItems: [
        "Connected to Spotify",
        "Configuration saved", 
        "Ready to use"
      ]
    }
  },
  logs: {
    title: "Activity logs",
    appStarted: "Application started"
  },
  modals: {
    addApp: {
      title: "Add application to exclude",
      placeholder: "e.g. chrome, discord, game.exe"
    },
    error: {
      title: "An error occurred",
      connectionFailed: "Failed to connect to Spotify.",
      authIncomplete: "Spotify authorization is not yet complete. Check your browser and finish the authorization process.",
      configFailed: "Failed to update configuration",
      processesFailed: "Error loading processes"
    },
    loading: {
      title: "Connecting to Spotify...",
      description: "Please wait, authorizing with your Spotify account."
    }
  },
  footer: {
    spotifyConfig: "Spotify configuration",
    resetConfig: "Reset configuration", 
    version: "Made with ❤️"
  },
  tray: {
    exit: "Exit",
    configure: "Configure",
    reconfigure: "Reconfigure",
    spotifyDashboard: "Spotify Dashboard"
  },
  help: {
    needHelp: "Need help?",
    premiumInfo: "Premium requirements"
  },
  messages: {
    lastActivity: "Last activity:",
    currentStatus: "Status:",
    appAlreadyExcluded: "This application is already excluded",
    confirmReset: "Are you sure you want to reset the Spotify configuration? You will need to re-authorize the application.",
    resetFailed: "Failed to reset configuration. Please try again.",
    noProcesses: "No active audio processes found"
  }
};