/**
 * Commands for ribbon buttons
 */

Office.onReady(() => {
  console.log('Commands initialized');
});

/**
 * Function command handler
 * This can be used for quick actions from the ribbon
 */
function action(event) {
  // Currently not used, but can be extended for quick actions
  // For now, we use ShowTaskpane action which opens the taskpane
  event.completed();
}

// Register function
if (typeof Office !== 'undefined') {
  Office.actions.associate("action", action);
}

