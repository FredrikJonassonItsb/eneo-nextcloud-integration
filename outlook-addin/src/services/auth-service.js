/**
 * Authentication Service
 * Handles OAuth2 authentication with Nextcloud
 */

/**
 * Initialize OAuth2 login flow
 * Opens authorization URL in a dialog
 */
async function login() {
  const serverUrl = getServerUrl();
  const state = generateRandomString(32);
  const codeVerifier = generateRandomString(128);
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  
  // Save state and code verifier for callback
  sessionStorage.setItem('oauth_state', state);
  sessionStorage.setItem('oauth_code_verifier', codeVerifier);
  
  // Build authorization URL
  const authUrl = new URL(CONFIG.nextcloud.endpoints.oauth.authorize, serverUrl);
  authUrl.searchParams.append('client_id', CONFIG.oauth.clientId);
  authUrl.searchParams.append('redirect_uri', CONFIG.oauth.redirectUri);
  authUrl.searchParams.append('response_type', CONFIG.oauth.responseType);
  authUrl.searchParams.append('scope', CONFIG.oauth.scope);
  authUrl.searchParams.append('state', state);
  authUrl.searchParams.append('code_challenge', codeChallenge);
  authUrl.searchParams.append('code_challenge_method', 'S256');
  
  // Redirect to authorization URL
  // Note: Popup windows are blocked in Outlook Web, so we use full redirect
  console.log('Redirecting to:', authUrl.toString());
  window.location.href = authUrl.toString();
}

/**
 * Handle dialog message from auth callback
 */
function handleDialogMessage(arg) {
  const data = JSON.parse(arg.message);
  handleAuthCallback(data);
  
  // Close dialog
  if (typeof Office !== 'undefined' && Office.context && Office.context.ui) {
    Office.context.ui.closeContainer();
  }
}

/**
 * Handle dialog event (e.g., user closed dialog)
 */
function handleDialogEvent(arg) {
  if (arg.error === 12006) {
    // User closed dialog
    console.log('User closed auth dialog');
  }
}

/**
 * Handle OAuth2 callback
 * @param {object} data - Callback data with code and state
 */
async function handleAuthCallback(data) {
  const { code, state } = data;
  
  // Verify state
  const savedState = sessionStorage.getItem('oauth_state');
  if (state !== savedState) {
    throw new Error('Invalid state parameter');
  }
  
  // Exchange code for token
  await exchangeCodeForToken(code);
  
  // Clear session storage
  sessionStorage.removeItem('oauth_state');
  sessionStorage.removeItem('oauth_code_verifier');
}

/**
 * Exchange authorization code for access token
 * @param {string} code - Authorization code
 */
async function exchangeCodeForToken(code) {
  const serverUrl = getServerUrl();
  const codeVerifier = sessionStorage.getItem('oauth_code_verifier');
  
  const tokenUrl = new URL(CONFIG.nextcloud.endpoints.oauth.token, serverUrl);
  
  const params = new URLSearchParams();
  params.append('grant_type', 'authorization_code');
  params.append('code', code);
  params.append('redirect_uri', CONFIG.oauth.redirectUri);
  params.append('client_id', CONFIG.oauth.clientId);
  params.append('client_secret', CONFIG.oauth.clientSecret);
  params.append('code_verifier', codeVerifier);
  
  try {
    const response = await fetch(tokenUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });
    
    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Save tokens
    saveAccessToken(data.access_token, data.expires_in);
    if (data.refresh_token) {
      saveRefreshToken(data.refresh_token);
    }
    
    // Fetch and save user profile
    await fetchUserProfile();
    
    return data;
  } catch (error) {
    console.error('Token exchange error:', error);
    throw new Error(t('auth.loginFailed'));
  }
}

/**
 * Refresh access token using refresh token
 */
async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }
  
  const serverUrl = getServerUrl();
  const tokenUrl = new URL(CONFIG.nextcloud.endpoints.oauth.token, serverUrl);
  
  const params = new URLSearchParams();
  params.append('grant_type', 'refresh_token');
  params.append('refresh_token', refreshToken);
  params.append('client_id', CONFIG.oauth.clientId);
  params.append('client_secret', CONFIG.oauth.clientSecret);
  
  try {
    const response = await fetch(tokenUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });
    
    if (!response.ok) {
      // Refresh token is invalid, need to login again
      logout();
      throw new Error('Refresh token invalid');
    }
    
    const data = await response.json();
    
    // Save new tokens
    saveAccessToken(data.access_token, data.expires_in);
    if (data.refresh_token) {
      saveRefreshToken(data.refresh_token);
    }
    
    return data;
  } catch (error) {
    console.error('Token refresh error:', error);
    throw error;
  }
}

/**
 * Fetch user profile from Nextcloud
 */
async function fetchUserProfile() {
  const serverUrl = getServerUrl();
  const accessToken = getAccessToken();
  
  if (!accessToken) {
    throw new Error('No access token');
  }
  
  const userInfoUrl = new URL(CONFIG.nextcloud.endpoints.oauth.userInfo, serverUrl);
  
  try {
    const response = await fetch(userInfoUrl.toString(), {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'OCS-APIRequest': 'true',
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch user profile: ${response.status}`);
    }
    
    const data = await response.json();
    const profile = data.ocs.data;
    
    // Save profile
    saveUserProfile(profile);
    
    return profile;
  } catch (error) {
    console.error('User profile fetch error:', error);
    throw error;
  }
}

/**
 * Logout user
 * Clears all stored tokens and user data
 */
function logout() {
  clearAll();
}

/**
 * Get current user
 * @returns {object|null} User profile or null if not authenticated
 */
function getCurrentUser() {
  if (!isAuthenticated()) {
    return null;
  }
  return getUserProfile();
}

/**
 * Generate random string for state and code verifier
 * @param {number} length - String length
 * @returns {string} Random string
 */
function generateRandomString(length) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const values = new Uint8Array(length);
  crypto.getRandomValues(values);
  return Array.from(values)
    .map(v => charset[v % charset.length])
    .join('');
}

/**
 * Generate PKCE code challenge
 * @param {string} codeVerifier - Code verifier
 * @returns {Promise<string>} Code challenge
 */
async function generateCodeChallenge(codeVerifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(hash);
}

/**
 * Base64 URL encode
 * @param {ArrayBuffer} buffer - Buffer to encode
 * @returns {string} Base64 URL encoded string
 */
function base64UrlEncode(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    login,
    logout,
    refreshAccessToken,
    getCurrentUser,
    fetchUserProfile
  };
}

