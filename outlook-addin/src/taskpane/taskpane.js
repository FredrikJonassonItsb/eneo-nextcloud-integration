/**
 * Taskpane main logic
 */

// Global state
let currentMeeting = null;

/**
 * Initialize Office Add-in
 */
Office.onReady((info) => {
  if (info.host === Office.HostType.Outlook) {
    console.log('Office Add-in initialized');
    
    // Initialize UI
    initializeUI();
    
    // Check authentication status
    checkAuthStatus();
    
    // Set up event listeners
    setupEventListeners();
  }
});

/**
 * Initialize UI with translations
 */
function initializeUI() {
  // Translate all elements with data-i18n attribute
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    element.textContent = t(key);
  });
  
  // Translate placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
    const key = element.getAttribute('data-i18n-placeholder');
    element.placeholder = t(key);
  });
}

/**
 * Check authentication status and show appropriate view
 */
async function checkAuthStatus() {
  try {
    if (isAuthenticated()) {
      // User is authenticated, load meeting data
      await loadMeetingData();
      showView('main-view');
    } else {
      // User needs to log in
      showView('login-view');
    }
  } catch (error) {
    console.error('Auth check error:', error);
    showError(error.message);
  }
}

/**
 * Load meeting data from Outlook
 */
async function loadMeetingData() {
  try {
    showStatus(t('app.loading'), 'info');
    
    // Get meeting details
    const subject = await getSubject();
    const startTime = await getStartTime();
    const endTime = await getEndTime();
    const attendees = await getAllAttendees();
    
    // Store meeting data
    currentMeeting = {
      subject,
      startTime,
      endTime,
      attendees
    };
    
    // Update UI
    document.getElementById('meeting-subject').textContent = subject || t('message.noMeetingSelected');
    document.getElementById('meeting-start').textContent = startTime ? startTime.toLocaleString(getCurrentLocale()) : '-';
    document.getElementById('meeting-end').textContent = endTime ? endTime.toLocaleString(getCurrentLocale()) : '-';
    document.getElementById('meeting-attendees').textContent = attendees.length > 0 
      ? attendees.map(a => a.displayName || a.emailAddress).join(', ')
      : '-';
    
    // Pre-fill room name with subject
    document.getElementById('room-name').value = subject || '';
    
    // Load user profile
    const user = getCurrentUser();
    if (user) {
      updateUserInfo(user);
    }
    
    hideStatus();
  } catch (error) {
    console.error('Load meeting data error:', error);
    showError(error.message);
  }
}

/**
 * Update user info display
 */
function updateUserInfo(user) {
  const displayName = user.displayname || user.id;
  const email = user.email || user.id;
  
  document.getElementById('user-name').textContent = displayName;
  document.getElementById('user-email').textContent = email;
  
  // Set initials
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
  document.getElementById('user-initials').textContent = initials;
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Login button
  document.getElementById('login-button').addEventListener('click', handleLogin);
  
  // Logout button
  document.getElementById('logout-button').addEventListener('click', handleLogout);
  
  // Create meeting button
  document.getElementById('create-meeting-button').addEventListener('click', handleCreateMeeting);
  
  // Retry button
  document.getElementById('retry-button').addEventListener('click', () => {
    showView('loading-view');
    checkAuthStatus();
  });
}

/**
 * Handle login
 */
async function handleLogin() {
  try {
    showStatus(t('auth.loggingIn'), 'info');
    
    await login();
    
    showStatus(t('auth.loginSuccess'), 'success');
    
    // Reload meeting data
    await loadMeetingData();
    showView('main-view');
  } catch (error) {
    console.error('Login error:', error);
    showError(t('auth.loginFailed') + ': ' + error.message);
  }
}

/**
 * Handle logout
 */
function handleLogout() {
  logout();
  showView('login-view');
}

/**
 * Handle create meeting
 */
async function handleCreateMeeting() {
  try {
    if (!currentMeeting) {
      throw new Error(t('message.noMeetingSelected'));
    }
    
    // Disable button
    const button = document.getElementById('create-meeting-button');
    button.disabled = true;
    button.textContent = t('meeting.creating');
    
    showStatus(t('meeting.creating'), 'info');
    
    // Get settings
    const roomName = document.getElementById('room-name').value || currentMeeting.subject;
    const allowGuests = document.getElementById('allow-guests').checked;
    const password = document.getElementById('room-password').value || null;
    const removeTeams = document.getElementById('remove-teams-link').checked;
    const createCalendar = document.getElementById('create-calendar-event').checked;
    
    // Create Talk room
    const room = await createTalkRoom({
      roomName,
      roomType: CONFIG.meeting.defaultRoomType,
      allowGuests,
      password
    });
    
    const roomUrl = getTalkRoomUrl(room.token);
    
    showStatus(t('meeting.created'), 'success');
    
    // Add meeting link to Outlook
    await addTalkMeetingLink(roomUrl, currentMeeting.startTime);
    
    showStatus(t('meeting.linkAdded'), 'success');
    
    // Create calendar event if enabled
    if (createCalendar) {
      try {
        showStatus(t('calendar.creating'), 'info');
        
        await createCalendarEvent({
          summary: currentMeeting.subject,
          start: currentMeeting.startTime,
          end: currentMeeting.endTime,
          description: `Nextcloud Talk: ${roomUrl}`,
          location: t('message.meetingLocation'),
          attendees: currentMeeting.attendees.map(a => a.emailAddress)
        });
        
        showStatus(t('calendar.created'), 'success');
      } catch (calError) {
        console.warn('Calendar creation failed:', calError);
        showStatus(t('calendar.failed'), 'error');
      }
    }
    
    // Show success notification
    showNotification(t('meeting.created'), 'informationalMessage');
    
    // Final success message
    setTimeout(() => {
      showStatus(
        `✓ ${t('meeting.created')} - ${roomUrl}`,
        'success'
      );
    }, 1000);
    
  } catch (error) {
    console.error('Create meeting error:', error);
    showError(error.message);
    showNotification(error.message, 'errorMessage');
  } finally {
    // Re-enable button
    const button = document.getElementById('create-meeting-button');
    button.disabled = false;
    button.textContent = t('meeting.addLink');
  }
}

/**
 * Show specific view
 */
function showView(viewId) {
  document.querySelectorAll('.view').forEach(view => {
    view.classList.add('hidden');
  });
  
  const targetView = document.getElementById(viewId);
  if (targetView) {
    targetView.classList.remove('hidden');
  }
}

/**
 * Show status message
 */
function showStatus(message, type = 'info') {
  const statusElement = document.getElementById('status-message');
  const statusText = document.getElementById('status-text');
  
  statusText.textContent = message;
  statusElement.className = `status-message ${type}`;
  statusElement.classList.remove('hidden');
}

/**
 * Hide status message
 */
function hideStatus() {
  const statusElement = document.getElementById('status-message');
  statusElement.classList.add('hidden');
}

/**
 * Show error view
 */
function showError(message) {
  document.getElementById('error-message').textContent = message;
  showView('error-view');
}

