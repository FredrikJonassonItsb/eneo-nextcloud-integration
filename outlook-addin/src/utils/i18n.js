/**
 * Internationalization (i18n) module
 * Provides multi-language support for the add-in
 */

const translations = {
  'sv-SE': {
    // General
    'app.name': 'Nextcloud Talk för Outlook',
    'app.loading': 'Laddar...',
    'app.error': 'Ett fel uppstod',
    
    // Authentication
    'auth.login': 'Logga in',
    'auth.logout': 'Logga ut',
    'auth.loginPrompt': 'Logga in på Nextcloud för att fortsätta',
    'auth.loginButton': 'Logga in med Nextcloud',
    'auth.loggingIn': 'Loggar in...',
    'auth.loginSuccess': 'Inloggning lyckades!',
    'auth.loginFailed': 'Inloggning misslyckades',
    'auth.notAuthenticated': 'Du är inte inloggad',
    
    // Meeting creation
    'meeting.create': 'Skapa Nextcloud Talk-möte',
    'meeting.creating': 'Skapar möte...',
    'meeting.created': 'Möte skapat!',
    'meeting.failed': 'Kunde inte skapa möte',
    'meeting.addLink': 'Lägg till Nextcloud Talk-möte',
    'meeting.linkAdded': 'Möteslänk tillagd',
    'meeting.roomName': 'Mötesnamn',
    'meeting.roomNamePlaceholder': 'Ange mötesnamn',
    
    // Meeting settings
    'settings.title': 'Mötesinställningar',
    'settings.allowGuests': 'Tillåt gäster',
    'settings.password': 'Lösenord',
    'settings.passwordPlaceholder': 'Valfritt lösenord',
    'settings.notifications': 'Notifieringar',
    
    // Participants
    'participants.title': 'Deltagare',
    'participants.add': 'Lägg till deltagare',
    'participants.remove': 'Ta bort',
    'participants.authLevel': 'Autentiseringsnivå',
    'participants.authNone': 'Ingen',
    'participants.authSMS': 'SMS',
    'participants.authLOA3': 'LOA-3 (BankID)',
    'participants.notification': 'Notifiering',
    'participants.notificationEmail': 'E-post',
    'participants.notificationSMS': 'SMS',
    'participants.notificationBoth': 'E-post + SMS',
    'participants.personalNumber': 'Personnummer',
    'participants.phoneNumber': 'Telefonnummer',
    'participants.secureEmail': 'Säker e-post',
    
    // Calendar
    'calendar.creating': 'Skapar kalenderhändelse...',
    'calendar.created': 'Kalenderhändelse skapad',
    'calendar.failed': 'Kunde inte skapa kalenderhändelse',
    
    // Teams integration
    'teams.removing': 'Tar bort Teams-länk...',
    'teams.removed': 'Teams-länk borttagen',
    
    // Errors
    'error.network': 'Nätverksfel - kontrollera din anslutning',
    'error.server': 'Serverfel - försök igen senare',
    'error.auth': 'Autentiseringsfel - logga in igen',
    'error.permission': 'Behörighet saknas',
    'error.notFound': 'Hittades inte',
    'error.unknown': 'Ett okänt fel uppstod',
    
    // Buttons
    'button.ok': 'OK',
    'button.cancel': 'Avbryt',
    'button.save': 'Spara',
    'button.close': 'Stäng',
    'button.retry': 'Försök igen',
    
    // Messages
    'message.meetingLinkTemplate': 'Delta i mötet via Nextcloud Talk:\n{link}\n\nMötet startar: {startTime}',
    'message.meetingLocation': 'Nextcloud Talk (online)',
    'message.noMeetingSelected': 'Inget möte valt',
    'message.selectMeeting': 'Välj ett möte för att lägga till Nextcloud Talk'
  },
  
  'en-US': {
    // General
    'app.name': 'Nextcloud Talk for Outlook',
    'app.loading': 'Loading...',
    'app.error': 'An error occurred',
    
    // Authentication
    'auth.login': 'Log in',
    'auth.logout': 'Log out',
    'auth.loginPrompt': 'Log in to Nextcloud to continue',
    'auth.loginButton': 'Log in with Nextcloud',
    'auth.loggingIn': 'Logging in...',
    'auth.loginSuccess': 'Login successful!',
    'auth.loginFailed': 'Login failed',
    'auth.notAuthenticated': 'You are not logged in',
    
    // Meeting creation
    'meeting.create': 'Create Nextcloud Talk meeting',
    'meeting.creating': 'Creating meeting...',
    'meeting.created': 'Meeting created!',
    'meeting.failed': 'Could not create meeting',
    'meeting.addLink': 'Add Nextcloud Talk meeting',
    'meeting.linkAdded': 'Meeting link added',
    'meeting.roomName': 'Meeting name',
    'meeting.roomNamePlaceholder': 'Enter meeting name',
    
    // Meeting settings
    'settings.title': 'Meeting settings',
    'settings.allowGuests': 'Allow guests',
    'settings.password': 'Password',
    'settings.passwordPlaceholder': 'Optional password',
    'settings.notifications': 'Notifications',
    
    // Participants
    'participants.title': 'Participants',
    'participants.add': 'Add participant',
    'participants.remove': 'Remove',
    'participants.authLevel': 'Authentication level',
    'participants.authNone': 'None',
    'participants.authSMS': 'SMS',
    'participants.authLOA3': 'LOA-3 (BankID)',
    'participants.notification': 'Notification',
    'participants.notificationEmail': 'Email',
    'participants.notificationSMS': 'SMS',
    'participants.notificationBoth': 'Email + SMS',
    'participants.personalNumber': 'Personal number',
    'participants.phoneNumber': 'Phone number',
    'participants.secureEmail': 'Secure email',
    
    // Calendar
    'calendar.creating': 'Creating calendar event...',
    'calendar.created': 'Calendar event created',
    'calendar.failed': 'Could not create calendar event',
    
    // Teams integration
    'teams.removing': 'Removing Teams link...',
    'teams.removed': 'Teams link removed',
    
    // Errors
    'error.network': 'Network error - check your connection',
    'error.server': 'Server error - try again later',
    'error.auth': 'Authentication error - log in again',
    'error.permission': 'Permission denied',
    'error.notFound': 'Not found',
    'error.unknown': 'An unknown error occurred',
    
    // Buttons
    'button.ok': 'OK',
    'button.cancel': 'Cancel',
    'button.save': 'Save',
    'button.close': 'Close',
    'button.retry': 'Retry',
    
    // Messages
    'message.meetingLinkTemplate': 'Join the meeting via Nextcloud Talk:\n{link}\n\nMeeting starts: {startTime}',
    'message.meetingLocation': 'Nextcloud Talk (online)',
    'message.noMeetingSelected': 'No meeting selected',
    'message.selectMeeting': 'Select a meeting to add Nextcloud Talk'
  }
};

/**
 * Get current locale from storage or browser
 */
function getCurrentLocale() {
  // Try to get from storage
  const stored = localStorage.getItem(CONFIG.storage.locale);
  if (stored && CONFIG.app.supportedLocales.includes(stored)) {
    return stored;
  }
  
  // Try to get from browser
  const browserLocale = navigator.language || navigator.userLanguage;
  if (CONFIG.app.supportedLocales.includes(browserLocale)) {
    return browserLocale;
  }
  
  // Fall back to default
  return CONFIG.app.defaultLocale;
}

/**
 * Get translated string
 * @param {string} key - Translation key
 * @param {object} params - Parameters to replace in the string
 * @returns {string} Translated string
 */
function t(key, params = {}) {
  const locale = getCurrentLocale();
  const translation = translations[locale] || translations[CONFIG.app.defaultLocale];
  let text = translation[key] || key;
  
  // Replace parameters
  Object.keys(params).forEach(param => {
    text = text.replace(`{${param}}`, params[param]);
  });
  
  return text;
}

/**
 * Set current locale
 * @param {string} locale - Locale code (e.g., 'sv-SE', 'en-US')
 */
function setLocale(locale) {
  if (CONFIG.app.supportedLocales.includes(locale)) {
    localStorage.setItem(CONFIG.storage.locale, locale);
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { t, getCurrentLocale, setLocale };
}

