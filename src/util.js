'use strict';
const log = require('./log');

const util = {
  generateMessageID: function () {
    const S4 = function () {
      return Math.floor(Math.random() * 0x10000 /* 65536 */).toString(36);
    };

    return (
      S4() + '-' + S4() + '-' + S4() + '-' + S4()
    );
  },

  generateControlError: function(name, code, description) {
    let headers = {
      namespace: 'Control',
      name: name,
      payloadVersion: '1'
    };

    let payload = {
      exception: {
        code: code,
        description: description
      }
    };

    let result = {
      header: headers,
      payload: payload
    };

    return JSON.stringify(result, undefined, 2);
  },


  getErrorHandler: function(context) {
    return function serverError(e) {
      log('Error', e.message);
      /**
       * Craft an error response back to Alexa Smart Home Skill
       */
      context.fail(util.generateControlError('Discovery', 'DEPENDENT_SERVICE_UNAVAILABLE', 'Unable to connect to server'));
    };
  },

  prettifyDeviceType: function(str) {
    switch (str) {
      case "PLUG":
        return "Crownstone Plug";
      case "BUILTIN":
        return "Crownstone Built-In";
      case "BUILTIN_ONE":
        return "Crownstone Built-In One";
      case "GUIDESTONE":
        return "Guidestone";
      case "CROWNSTONE_USB":
        return "Crownstone USB Dongle";
      case "CROWNSTONE_HUB":
        return "Crownstone Hub";
    }
    return str;
  }

};


module.exports = util;
