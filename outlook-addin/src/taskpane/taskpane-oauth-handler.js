/**
 * Handle OAuth return after redirect
 */
async function handleOAuthReturn() {
  try {
    console.log('Handling OAuth return...');
    
    // Get OAuth code and state from sessionStorage
    const code = sessionStorage.getItem('oauth_code');
    const state = sessionStorage.getItem('oauth_state');
    
    // Clear from sessionStorage
    sessionStorage.removeItem('oauth_code');
    sessionStorage.removeItem('oauth_state');
    
    if (!code || !state) {
      throw new Error('Missing OAuth code or state');
    }
    
    // Verify state
    const savedState = localStorage.getItem('oauth_state');
    if (state !== savedState) {
      throw new Error('Invalid OAuth state');
    }
    
    // Show loading
    showStatus('Autentiserar...', 'info');
    
    // Exchange code for token
    const tokenData = await exchangeCodeForToken(code);
    
    // Save tokens
    saveTokens(tokenData);
    
    // Clean up URL
    window.history.replaceState({}, document.title, window.location.pathname);
    
    // Load user data and show main view
    await checkAuthStatus();
    
    showStatus('Inloggad!', 'success');
    
  } catch (error) {
    console.error('OAuth return error:', error);
    showError('Inloggning misslyckades: ' + error.message);
    showView('login-view');
  }
}

/**
 * Exchange authorization code for access token
 */
async function exchangeCodeForToken(code) {
  const codeVerifier = localStorage.getItem('oauth_code_verifier');
  if (!codeVerifier) {
    throw new Error('Missing code verifier');
  }
  
  const tokenUrl = `${CONFIG.nextcloud.serverUrl}${CONFIG.nextcloud.endpoints.oauth.token}`;
  
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: CONFIG.oauth.redirectUri,
      client_id: CONFIG.oauth.clientId,
      client_secret: CONFIG.oauth.clientSecret,
      code_verifier: codeVerifier
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }
  
  return await response.json();
}

/**
 * Save tokens to storage
 */
function saveTokens(tokenData) {
  localStorage.setItem('nextcloud_token', tokenData.access_token);
  if (tokenData.refresh_token) {
    localStorage.setItem('nextcloud_refresh_token', tokenData.refresh_token);
  }
  if (tokenData.expires_in) {
    const expiresAt = Date.now() + (tokenData.expires_in * 1000);
    localStorage.setItem('nextcloud_token_expires_at', expiresAt.toString());
  }
  
  // Clean up OAuth state
  localStorage.removeItem('oauth_state');
  localStorage.removeItem('oauth_code_verifier');
}

