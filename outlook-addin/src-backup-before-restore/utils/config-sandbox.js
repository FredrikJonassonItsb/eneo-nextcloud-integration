/**
 * Configuration for Nextcloud Talk Outlook Add-in (SANDBOX VERSION)
 * 
 * This file contains all configuration settings for the add-in running in Manus sandbox.
 */

const CONFIG = {
  nextcloud: {
    // Nextcloud server URL - Manus sandbox
    serverUrl: 'https://9000-ifssjy14k2l0litjczljm-ba9c44b6.manusvm.computer',
    
    endpoints: {
      // Nextcloud Talk API endpoint for creating rooms
      talkRoom: '/ocs/v2.php/apps/spreed/api/v4/room',
      
      // Nextcloud Talk API endpoint for participants
      talkParticipants: '/ocs/v2.php/apps/spreed/api/v4/room/{token}/participants',
      
      // CalDAV base endpoint for calendar operations
      calendarBase: '/remote.php/dav/calendars',
      
      // OAuth2 endpoints
      oauth: {
        authorize: '/apps/oauth2/authorize',
        token: '/apps/oauth2/api/v1/token',
        userInfo: '/ocs/v2.php/cloud/user?format=json'
      }
    },
    
    // Default calendar name (usually 'personal' or 'default')
    defaultCalendar: 'personal'
  },
  
  oauth: {
    // OAuth2 Client ID - To be configured in Nextcloud
    clientId: 'outlook-nextcloud-addin',
    
    // OAuth2 Client Secret - To be configured in Nextcloud
    clientSecret: 'YOUR_CLIENT_SECRET_HERE',
    
    // Redirect URI - Sandbox URL
    redirectUri: 'https://8080-ifssjy14k2l0litjczljm-ba9c44b6.manusvm.computer/src/taskpane/callback.html',
    
    // OAuth2 scope
    scope: 'openid profile email',
    
    // OAuth2 response type
    responseType: 'code'
  },
  
  app: {
    // Application name
    name: 'Nextcloud Talk for Outlook (Sandbox)',
    
    // Application version
    version: '2.0.0-sandbox',
    
    // Default locale
    defaultLocale: 'sv-SE',
    
    // Supported locales
    supportedLocales: ['sv-SE', 'en-US']
  },
  
  storage: {
    // LocalStorage keys
    accessToken: 'nc_access_token',
    refreshToken: 'nc_refresh_token',
    tokenExpiry: 'nc_token_expiry',
    serverUrl: 'nc_server_url',
    userProfile: 'nc_user_profile',
    locale: 'app_locale'
  },
  
  meeting: {
    // Default room type: 1=One-to-one, 2=Group, 3=Public, 4=Changelog
    defaultRoomType: 3,
    
    // Allow guests to join
    allowGuests: true,
    
    // Default authentication level for participants
    // Options: 'none', 'sms', 'loa3'
    defaultAuthLevel: 'none',
    
    // Default notification method
    // Options: 'email', 'sms', 'email_sms'
    defaultNotification: 'email'
  },
  
  features: {
    // Automatically remove Teams links when adding Nextcloud Talk link
    removeTeamsLinks: true,
    
    // Automatically add meeting link to calendar event
    autoAddMeetingLink: true,
    
    // Enable participant-specific security settings (LOA-3, SMS, secure email)
    participantSpecificSecurity: false,  // Future feature
    
    // Enable multi-language support
    multiLanguageSupport: true
  },
  
  timeouts: {
    // API request timeout (milliseconds)
    api: 10000,
    
    // Authentication timeout (milliseconds)
    auth: 30000
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}

