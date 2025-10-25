/**
 * Storage utility module
 * Provides secure storage for tokens and user data
 */

/**
 * Save access token
 * @param {string} token - Access token
 * @param {number} expiresIn - Token expiry time in seconds
 */
function saveAccessToken(token, expiresIn) {
  const expiry = Date.now() + (expiresIn * 1000);
  localStorage.setItem(CONFIG.storage.accessToken, token);
  localStorage.setItem(CONFIG.storage.tokenExpiry, expiry.toString());
}

/**
 * Get access token
 * @returns {string|null} Access token or null if not found/expired
 */
function getAccessToken() {
  const token = localStorage.getItem(CONFIG.storage.accessToken);
  const expiry = localStorage.getItem(CONFIG.storage.tokenExpiry);
  
  if (!token || !expiry) {
    return null;
  }
  
  // Check if token is expired
  if (Date.now() >= parseInt(expiry)) {
    clearAccessToken();
    return null;
  }
  
  return token;
}

/**
 * Clear access token
 */
function clearAccessToken() {
  localStorage.removeItem(CONFIG.storage.accessToken);
  localStorage.removeItem(CONFIG.storage.tokenExpiry);
}

/**
 * Save refresh token
 * @param {string} token - Refresh token
 */
function saveRefreshToken(token) {
  localStorage.setItem(CONFIG.storage.refreshToken, token);
}

/**
 * Get refresh token
 * @returns {string|null} Refresh token or null if not found
 */
function getRefreshToken() {
  return localStorage.getItem(CONFIG.storage.refreshToken);
}

/**
 * Clear refresh token
 */
function clearRefreshToken() {
  localStorage.removeItem(CONFIG.storage.refreshToken);
}

/**
 * Save user profile
 * @param {object} profile - User profile data
 */
function saveUserProfile(profile) {
  localStorage.setItem(CONFIG.storage.userProfile, JSON.stringify(profile));
}

/**
 * Get user profile
 * @returns {object|null} User profile or null if not found
 */
function getUserProfile() {
  const profile = localStorage.getItem(CONFIG.storage.userProfile);
  return profile ? JSON.parse(profile) : null;
}

/**
 * Clear user profile
 */
function clearUserProfile() {
  localStorage.removeItem(CONFIG.storage.userProfile);
}

/**
 * Save server URL
 * @param {string} url - Nextcloud server URL
 */
function saveServerUrl(url) {
  localStorage.setItem(CONFIG.storage.serverUrl, url);
}

/**
 * Get server URL
 * @returns {string} Server URL (from storage or config)
 */
function getServerUrl() {
  return localStorage.getItem(CONFIG.storage.serverUrl) || CONFIG.nextcloud.serverUrl;
}

/**
 * Clear server URL
 */
function clearServerUrl() {
  localStorage.removeItem(CONFIG.storage.serverUrl);
}

/**
 * Check if user is authenticated
 * @returns {boolean} True if user has valid access token
 */
function isAuthenticated() {
  return getAccessToken() !== null;
}

/**
 * Clear all stored data (logout)
 */
function clearAll() {
  clearAccessToken();
  clearRefreshToken();
  clearUserProfile();
  // Don't clear server URL - keep it for next login
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    saveAccessToken,
    getAccessToken,
    clearAccessToken,
    saveRefreshToken,
    getRefreshToken,
    clearRefreshToken,
    saveUserProfile,
    getUserProfile,
    clearUserProfile,
    saveServerUrl,
    getServerUrl,
    clearServerUrl,
    isAuthenticated,
    clearAll
  };
}

