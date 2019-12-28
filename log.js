/**
 * Utility functions.
 */
function log(title, msg) {
  //console.log('*************** ' + title + ' *************');
  console.log(title);
  if (msg) {
    console.log(msg);
  }
  //console.log('*************** ' + title + ' End*************');
}

module.exports = log;
