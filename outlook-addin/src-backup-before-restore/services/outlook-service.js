/**
 * Outlook Service
 * Wrapper for Outlook JavaScript API
 */

/**
 * Get current appointment item
 * @returns {Promise<Office.Types.ItemCompose|Office.Types.ItemRead>} Current item
 */
async function getCurrentItem() {
  return new Promise((resolve, reject) => {
    if (typeof Office === 'undefined' || !Office.context || !Office.context.mailbox) {
      reject(new Error('Office context not available'));
      return;
    }
    
    const item = Office.context.mailbox.item;
    if (!item) {
      reject(new Error(t('message.noMeetingSelected')));
      return;
    }
    
    resolve(item);
  });
}

/**
 * Get appointment subject
 * @returns {Promise<string>} Appointment subject
 */
async function getSubject() {
  const item = await getCurrentItem();
  
  return new Promise((resolve, reject) => {
    item.subject.getAsync((result) => {
      if (result.status === Office.AsyncResultStatus.Succeeded) {
        resolve(result.value);
      } else {
        reject(new Error('Failed to get subject'));
      }
    });
  });
}

/**
 * Get appointment start time
 * @returns {Promise<Date>} Start time
 */
async function getStartTime() {
  const item = await getCurrentItem();
  
  return new Promise((resolve, reject) => {
    item.start.getAsync((result) => {
      if (result.status === Office.AsyncResultStatus.Succeeded) {
        resolve(result.value);
      } else {
        reject(new Error('Failed to get start time'));
      }
    });
  });
}

/**
 * Get appointment end time
 * @returns {Promise<Date>} End time
 */
async function getEndTime() {
  const item = await getCurrentItem();
  
  return new Promise((resolve, reject) => {
    item.end.getAsync((result) => {
      if (result.status === Office.AsyncResultStatus.Succeeded) {
        resolve(result.value);
      } else {
        reject(new Error('Failed to get end time'));
      }
    });
  });
}

/**
 * Get appointment body
 * @returns {Promise<string>} Body content
 */
async function getBody() {
  const item = await getCurrentItem();
  
  return new Promise((resolve, reject) => {
    item.body.getAsync(Office.CoercionType.Text, (result) => {
      if (result.status === Office.AsyncResultStatus.Succeeded) {
        resolve(result.value);
      } else {
        reject(new Error('Failed to get body'));
      }
    });
  });
}

/**
 * Set appointment body
 * @param {string} content - Body content
 * @param {string} coercionType - Content type (Text or Html)
 */
async function setBody(content, coercionType = Office.CoercionType.Html) {
  const item = await getCurrentItem();
  
  return new Promise((resolve, reject) => {
    item.body.setAsync(content, { coercionType }, (result) => {
      if (result.status === Office.AsyncResultStatus.Succeeded) {
        resolve();
      } else {
        reject(new Error('Failed to set body'));
      }
    });
  });
}

/**
 * Prepend content to appointment body
 * @param {string} content - Content to prepend
 * @param {string} coercionType - Content type (Text or Html)
 */
async function prependToBody(content, coercionType = Office.CoercionType.Html) {
  const item = await getCurrentItem();
  
  return new Promise((resolve, reject) => {
    item.body.prependAsync(content, { coercionType }, (result) => {
      if (result.status === Office.AsyncResultStatus.Succeeded) {
        resolve();
      } else {
        reject(new Error('Failed to prepend to body'));
      }
    });
  });
}

/**
 * Get appointment location
 * @returns {Promise<string>} Location
 */
async function getLocation() {
  const item = await getCurrentItem();
  
  return new Promise((resolve, reject) => {
    item.location.getAsync((result) => {
      if (result.status === Office.AsyncResultStatus.Succeeded) {
        resolve(result.value);
      } else {
        reject(new Error('Failed to get location'));
      }
    });
  });
}

/**
 * Set appointment location
 * @param {string} location - Location string
 */
async function setLocation(location) {
  const item = await getCurrentItem();
  
  return new Promise((resolve, reject) => {
    item.location.setAsync(location, (result) => {
      if (result.status === Office.AsyncResultStatus.Succeeded) {
        resolve();
      } else {
        reject(new Error('Failed to set location'));
      }
    });
  });
}

/**
 * Get required attendees
 * @returns {Promise<Array<object>>} Array of attendees
 */
async function getRequiredAttendees() {
  const item = await getCurrentItem();
  
  return new Promise((resolve, reject) => {
    item.requiredAttendees.getAsync((result) => {
      if (result.status === Office.AsyncResultStatus.Succeeded) {
        resolve(result.value);
      } else {
        reject(new Error('Failed to get attendees'));
      }
    });
  });
}

/**
 * Get optional attendees
 * @returns {Promise<Array<object>>} Array of attendees
 */
async function getOptionalAttendees() {
  const item = await getCurrentItem();
  
  return new Promise((resolve, reject) => {
    item.optionalAttendees.getAsync((result) => {
      if (result.status === Office.AsyncResultStatus.Succeeded) {
        resolve(result.value);
      } else {
        reject(new Error('Failed to get optional attendees'));
      }
    });
  });
}

/**
 * Get all attendees (required + optional)
 * @returns {Promise<Array<object>>} Array of all attendees
 */
async function getAllAttendees() {
  const required = await getRequiredAttendees();
  const optional = await getOptionalAttendees();
  return [...required, ...optional];
}

/**
 * Remove Teams link from body
 * Detects and removes Microsoft Teams meeting links
 */
async function removeTeamsLink() {
  const body = await getBody();
  
  // Patterns to detect Teams links
  const teamsPatterns = [
    /Join\s+Microsoft\s+Teams\s+Meeting[^\n]*/gi,
    /https:\/\/teams\.microsoft\.com\/l\/meetup-join\/[^\s]*/gi,
    /https:\/\/teams\.live\.com\/meet\/[^\s]*/gi,
    /Conference\s+ID:[^\n]*/gi,
    /Dial-in\s+Numbers[^\n]*/gi,
    /<https:\/\/aka\.ms\/JoinTeamsMeeting>[^\n]*/gi
  ];
  
  let cleanedBody = body;
  teamsPatterns.forEach(pattern => {
    cleanedBody = cleanedBody.replace(pattern, '');
  });
  
  // Remove excessive newlines
  cleanedBody = cleanedBody.replace(/\n{3,}/g, '\n\n');
  
  if (cleanedBody !== body) {
    await setBody(cleanedBody, Office.CoercionType.Text);
    return true;
  }
  
  return false;
}

/**
 * Add Nextcloud Talk meeting link to appointment
 * @param {string} roomUrl - Talk room URL
 * @param {Date} startTime - Meeting start time
 */
async function addTalkMeetingLink(roomUrl, startTime) {
  // Remove Teams link if configured
  if (CONFIG.features.removeTeamsLinks) {
    try {
      await removeTeamsLink();
    } catch (error) {
      console.warn('Failed to remove Teams link:', error);
    }
  }
  
  // Format meeting link message
  const message = t('message.meetingLinkTemplate', {
    link: roomUrl,
    startTime: startTime.toLocaleString(getCurrentLocale())
  });
  
  // Prepend to body
  await prependToBody(`\n\n${message}\n\n`, Office.CoercionType.Text);
  
  // Set location if configured
  if (CONFIG.features.autoAddMeetingLink) {
    const currentLocation = await getLocation();
    if (!currentLocation || currentLocation.trim() === '') {
      await setLocation(t('message.meetingLocation'));
    }
  }
}

/**
 * Show notification
 * @param {string} message - Notification message
 * @param {string} type - Notification type (informationalMessage, errorMessage, warningMessage)
 */
function showNotification(message, type = 'informationalMessage') {
  if (typeof Office === 'undefined' || !Office.context || !Office.context.mailbox) {
    console.log('Notification:', message);
    return;
  }
  
  const notification = {
    type: Office.MailboxEnums.ItemNotificationMessageType.InformationalMessage,
    message: message,
    icon: 'icon-16',
    persistent: false
  };
  
  if (type === 'errorMessage') {
    notification.type = Office.MailboxEnums.ItemNotificationMessageType.ErrorMessage;
    notification.persistent = true;
  } else if (type === 'warningMessage') {
    notification.type = Office.MailboxEnums.ItemNotificationMessageType.ProgressIndicator;
  }
  
  Office.context.mailbox.item.notificationMessages.addAsync('nextcloud-talk', notification);
}

/**
 * Remove notification
 */
function removeNotification() {
  if (typeof Office === 'undefined' || !Office.context || !Office.context.mailbox) {
    return;
  }
  
  Office.context.mailbox.item.notificationMessages.removeAsync('nextcloud-talk');
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getCurrentItem,
    getSubject,
    getStartTime,
    getEndTime,
    getBody,
    setBody,
    prependToBody,
    getLocation,
    setLocation,
    getRequiredAttendees,
    getOptionalAttendees,
    getAllAttendees,
    removeTeamsLink,
    addTalkMeetingLink,
    showNotification,
    removeNotification
  };
}

