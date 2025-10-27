/**
 * Authentication Service - Dialog-based OAuth2
 * Handles OAuth2 authentication with Nextcloud using Office dialog API
 */

/**
 * Check if user is authenticated
 * @returns {boolean} True if authenticated
 */
function isAuthenticated() {
  const accessToken = localStorage.getItem('nc_access_token');
  const expiry = localStorage.getItem('nc_token_expiry');
  
  if (!accessToken || !expiry) {
    return false;
  }
  
  // Check if token is expired
  return Date.now() < parseInt(expiry);
}

/**
 * Get current access token
 * @returns {string|null} Access token or null
 */
function getAccessToken() {
  if (!isAuthenticated()) {
    return null;
  }
  return localStorage.getItem('nc_access_token');
}

/**
 * Initiate OAuth2 login flow using Office dialog
 * @returns {Promise<void>}
 */
async function login() {
  const serverUrl = getServerUrl();
  
  // Generate state and PKCE parameters
  const state = generateRandomString(32);
  const codeVerifier = generateRandomString(128);
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  
  // Save state and code verifier for callback
  localStorage.setItem('oauth_state', state);
  localStorage.setItem('oauth_code_verifier', codeVerifier);
  
  // Build authorization URL
  const authUrl = buildAuthUrl(serverUrl, state, codeChallenge);
  
  console.log('Opening OAuth dialog:', authUrl);
  
  // Open authentication dialog
  return new Promise((resolve, reject) => {
    Office.context.ui.displayDialogAsync(
      authUrl,
      { height: 70, width: 40, promptBeforeOpen: false },
      (result) => {
        if (result.status === Office.AsyncResultStatus.Failed) {
          console.error('Failed to open login dialog:', result.error);
          reject(new Error('Failed to open login dialog: ' + result.error.message));
          return;
        }
        
        const dialog = result.value;
        
        // Listen for messages from dialog
        dialog.addEventHandler(Office.EventType.DialogMessageReceived, async (arg) => {
          try {
            console.log('Received message from dialog:', arg.message);
            const response = JSON.parse(arg.message);
            
            if (response.error) {
              dialog.close();
              reject(new Error(response.error));
              return;
            }
            
            if (response.code && response.state) {
              // Verify state
              const savedState = localStorage.getItem('oauth_state');
              if (response.state !== savedState) {
                dialog.close();
                reject(new Error('Invalid state parameter'));
                return;
              }
              
              // Exchange authorization code for tokens
              await exchangeCodeForToken(response.code);
              
              // Get user profile
              await fetchUserProfile();
              
              // Clear OAuth session data
              localStorage.removeItem('oauth_state');
              localStorage.removeItem('oauth_code_verifier');
              
              dialog.close();
              resolve();
            }
          } catch (error) {
            console.error('Error handling dialog message:', error);
            dialog.close();
            reject(error);
          }
        });
        
        // Handle dialog closed by user
        dialog.addEventHandler(Office.EventType.DialogEventReceived, (arg) => {
          console.log('Dialog event:', arg);
          if (arg.error === 12006) {
            // User closed dialog
            reject(new Error('Login cancelled by user'));
          } else {
            reject(new Error('Dialog error: ' + arg.error));
          }
        });
      }
    );
  });
}

/**
 * Build OAuth2 authorization URL
 * @param {string} serverUrl - Nextcloud server URL
 * @param {string} state - State parameter
 * @param {string} codeChallenge - PKCE code challenge
 * @returns {string} Authorization URL
 */
function buildAuthUrl(serverUrl, state, codeChallenge) {
  const authUrl = new URL(CONFIG.nextcloud.endpoints.oauth.authorize, serverUrl);
  authUrl.searchParams.append('client_id', CONFIG.oauth.clientId);
  authUrl.searchParams.append('redirect_uri', CONFIG.oauth.redirectUri);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('scope', CONFIG.oauth.scope);
  authUrl.searchParams.append('state', state);
  authUrl.searchParams.append('code_challenge', codeChallenge);
  authUrl.searchParams.append('code_challenge_method', 'S256');
  
  return authUrl.toString();
}

/**
 * Exchange authorization code for access token
 * @param {string} code - Authorization code
 * @returns {Promise<void>}
 */
async function exchangeCodeForToken(code) {
  const serverUrl = getServerUrl();
  const codeVerifier = localStorage.getItem('oauth_code_verifier');
  
  const tokenUrl = new URL(CONFIG.nextcloud.endpoints.oauth.token, serverUrl);
  
  const params = new URLSearchParams();
  params.append('grant_type', 'authorization_code');
  params.append('code', code);
  params.append('redirect_uri', CONFIG.oauth.redirectUri);
  params.append('client_id', CONFIG.oauth.clientId);
  params.append('client_secret', CONFIG.oauth.clientSecret);
  params.append('code_verifier', codeVerifier);
  
  console.log('Exchanging code for token...');
  
  try {
    const response = await fetch(tokenUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Token exchange failed:', response.status, errorText);
      throw new Error('Failed to exchange code for token: ' + response.status);
    }
    
    const data = await response.json();
    
    // Save tokens
    localStorage.setItem('nc_access_token', data.access_token);
    localStorage.setItem('nc_refresh_token', data.refresh_token);
    localStorage.setItem('nc_token_expiry', Date.now() + (data.expires_in * 1000));
    
    console.log('Token exchange successful');
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    throw error;
  }
}

/**
 * Fetch user profile from Nextcloud
 * @returns {Promise<void>}
 */
async function fetchUserProfile() {
  const serverUrl = getServerUrl();
  const accessToken = getAccessToken();
  
  if (!accessToken) {
    throw new Error('No access token available');
  }
  
  const profileUrl = new URL('/ocs/v2.php/cloud/user?format=json', serverUrl);
  
  try {
    const response = await fetch(profileUrl.toString(), {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'OCS-APIRequest': 'true'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }
    
    const data = await response.json();
    
    // Save user profile
    localStorage.setItem('nc_user_profile', JSON.stringify(data.ocs.data));
    
    console.log('User profile fetched:', data.ocs.data);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    // Don't throw - profile is optional
  }
}

/**
 * Logout user
 */
function logout() {
  localStorage.removeItem('nc_access_token');
  localStorage.removeItem('nc_refresh_token');
  localStorage.removeItem('nc_token_expiry');
  localStorage.removeItem('nc_user_profile');
  localStorage.removeItem('oauth_state');
  localStorage.removeItem('oauth_code_verifier');
}

/**
 * Get server URL
 * @returns {string} Server URL
 */
function getServerUrl() {
  return localStorage.getItem('nc_server_url') || CONFIG.nextcloud.serverUrl;
}

/**
 * Set server URL
 * @param {string} url - Server URL
 */
function setServerUrl(url) {
  localStorage.setItem('nc_server_url', url);
}

/**
 * Generate random string for state and code verifier
 * @param {number} length - Length of string
 * @returns {string} Random string
 */
function generateRandomString(length) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let result = '';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  
  for (let i = 0; i < length; i++) {
    result += charset[randomValues[i] % charset.length];
  }
  
  return result;
}

/**
 * Generate PKCE code challenge from verifier
 * @param {string} verifier - Code verifier
 * @returns {Promise<string>} Code challenge
 */
async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  
  // Convert to base64url
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

