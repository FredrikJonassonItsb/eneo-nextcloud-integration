/**
 * Nextcloud API Service
 * Handles communication with Nextcloud Talk and Calendar APIs
 */

/**
 * Create a Nextcloud Talk room
 * @param {object} options - Room creation options
 * @param {string} options.roomName - Name of the room
 * @param {number} options.roomType - Room type (1=One-to-one, 2=Group, 3=Public)
 * @param {boolean} options.allowGuests - Allow guests to join
 * @param {string} options.password - Optional room password
 * @returns {Promise<object>} Created room data
 */
async function createTalkRoom(options) {
  const {
    roomName,
    roomType = CONFIG.meeting.defaultRoomType,
    allowGuests = CONFIG.meeting.allowGuests,
    password = null
  } = options;
  
  const serverUrl = getServerUrl();
  const accessToken = getAccessToken();
  
  if (!accessToken) {
    throw new Error(t('auth.notAuthenticated'));
  }
  
  const url = new URL(CONFIG.nextcloud.endpoints.talkRoom, serverUrl);
  
  const body = {
    roomType: roomType,
    roomName: roomName
  };
  
  try {
    const response = await fetchWithAuth(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'OCS-APIRequest': 'true',
        'Accept': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create Talk room: ${response.status}`);
    }
    
    const data = await response.json();
    const room = data.ocs.data;
    
    // Set password if provided
    if (password) {
      await setRoomPassword(room.token, password);
    }
    
    // Configure guest access
    if (allowGuests) {
      await setRoomGuestAccess(room.token, true);
    }
    
    return room;
  } catch (error) {
    console.error('Create Talk room error:', error);
    throw new Error(t('meeting.failed'));
  }
}

/**
 * Set room password
 * @param {string} token - Room token
 * @param {string} password - Room password
 */
async function setRoomPassword(token, password) {
  const serverUrl = getServerUrl();
  const url = new URL(`${CONFIG.nextcloud.endpoints.talkRoom}/${token}/password`, serverUrl);
  
  const body = {
    password: password
  };
  
  try {
    const response = await fetchWithAuth(url.toString(), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'OCS-APIRequest': 'true',
        'Accept': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to set room password: ${response.status}`);
    }
  } catch (error) {
    console.error('Set room password error:', error);
    throw error;
  }
}

/**
 * Set room guest access
 * @param {string} token - Room token
 * @param {boolean} allow - Allow guests
 */
async function setRoomGuestAccess(token, allow) {
  const serverUrl = getServerUrl();
  const url = new URL(`${CONFIG.nextcloud.endpoints.talkRoom}/${token}`, serverUrl);
  
  const body = {
    lobbyState: allow ? 0 : 1  // 0=No lobby, 1=Lobby enabled
  };
  
  try {
    const response = await fetchWithAuth(url.toString(), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'OCS-APIRequest': 'true',
        'Accept': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to set guest access: ${response.status}`);
    }
  } catch (error) {
    console.error('Set guest access error:', error);
    throw error;
  }
}

/**
 * Add participant to Talk room
 * @param {string} token - Room token
 * @param {string} participantId - Participant user ID or email
 * @param {object} options - Participant options
 * @returns {Promise<object>} Participant data
 */
async function addParticipant(token, participantId, options = {}) {
  const serverUrl = getServerUrl();
  const endpoint = CONFIG.nextcloud.endpoints.talkParticipants.replace('{token}', token);
  const url = new URL(endpoint, serverUrl);
  
  const body = {
    newParticipant: participantId,
    source: 'users'  // 'users', 'groups', 'emails'
  };
  
  try {
    const response = await fetchWithAuth(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'OCS-APIRequest': 'true',
        'Accept': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to add participant: ${response.status}`);
    }
    
    const data = await response.json();
    return data.ocs.data;
  } catch (error) {
    console.error('Add participant error:', error);
    throw error;
  }
}

/**
 * Create calendar event in Nextcloud
 * @param {object} event - Event data
 * @param {string} event.summary - Event title
 * @param {Date} event.start - Start time
 * @param {Date} event.end - End time
 * @param {string} event.description - Event description
 * @param {string} event.location - Event location
 * @param {Array<string>} event.attendees - Attendee email addresses
 * @returns {Promise<object>} Created event data
 */
async function createCalendarEvent(event) {
  const {
    summary,
    start,
    end,
    description = '',
    location = '',
    attendees = []
  } = event;
  
  const serverUrl = getServerUrl();
  const user = getCurrentUser();
  
  if (!user) {
    throw new Error(t('auth.notAuthenticated'));
  }
  
  // Generate unique event ID
  const eventId = generateEventId();
  
  // Build CalDAV URL
  const calendarName = CONFIG.nextcloud.defaultCalendar;
  const url = new URL(
    `${CONFIG.nextcloud.endpoints.calendarBase}/${user.id}/${calendarName}/${eventId}.ics`,
    serverUrl
  );
  
  // Build iCalendar data
  const icalData = buildICalendarData({
    uid: eventId,
    summary,
    start,
    end,
    description,
    location,
    attendees
  });
  
  try {
    const response = await fetchWithAuth(url.toString(), {
      method: 'PUT',
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8'
      },
      body: icalData
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create calendar event: ${response.status}`);
    }
    
    return { eventId, url: url.toString() };
  } catch (error) {
    console.error('Create calendar event error:', error);
    throw new Error(t('calendar.failed'));
  }
}

/**
 * Build iCalendar data
 * @param {object} event - Event data
 * @returns {string} iCalendar formatted string
 */
function buildICalendarData(event) {
  const { uid, summary, start, end, description, location, attendees } = event;
  
  const formatDate = (date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };
  
  let ical = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Nextcloud Talk for Outlook//EN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatDate(new Date())}`,
    `DTSTART:${formatDate(start)}`,
    `DTEND:${formatDate(end)}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
    `LOCATION:${location}`
  ];
  
  // Add attendees
  attendees.forEach(email => {
    ical.push(`ATTENDEE;CN=${email};RSVP=TRUE:mailto:${email}`);
  });
  
  ical.push('END:VEVENT');
  ical.push('END:VCALENDAR');
  
  return ical.join('\r\n');
}

/**
 * Generate unique event ID
 * @returns {string} Event ID
 */
function generateEventId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Fetch with authentication
 * Automatically handles token refresh if needed
 * @param {string} url - Request URL
 * @param {object} options - Fetch options
 * @returns {Promise<Response>} Fetch response
 */
async function fetchWithAuth(url, options = {}) {
  let accessToken = getAccessToken();
  
  if (!accessToken) {
    throw new Error(t('auth.notAuthenticated'));
  }
  
  // Add authorization header
  options.headers = options.headers || {};
  options.headers['Authorization'] = `Bearer ${accessToken}`;
  
  // Set timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONFIG.timeouts.api);
  options.signal = controller.signal;
  
  try {
    const response = await fetch(url, options);
    clearTimeout(timeoutId);
    
    // If unauthorized, try to refresh token
    if (response.status === 401) {
      try {
        await refreshAccessToken();
        accessToken = getAccessToken();
        options.headers['Authorization'] = `Bearer ${accessToken}`;
        
        // Retry request with new token
        return await fetch(url, options);
      } catch (refreshError) {
        // Refresh failed, need to login again
        throw new Error(t('auth.notAuthenticated'));
      }
    }
    
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error(t('error.network'));
    }
    
    throw error;
  }
}

/**
 * Get Talk room URL
 * @param {string} token - Room token
 * @returns {string} Room URL
 */
function getTalkRoomUrl(token) {
  const serverUrl = getServerUrl();
  return `${serverUrl}/call/${token}`;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    createTalkRoom,
    addParticipant,
    createCalendarEvent,
    getTalkRoomUrl
  };
}

