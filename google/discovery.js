'use strict';

const https = require('https');
const util = require('../util');
const config = require('../config');
const log = require('../log');

/**
 * Retrieve "Bearer XXX" from Authorization header. Add it to the event as accessToken to access
 * the Crownstone servers.
 */
function getAccessToken(event) {
  let bearer = event.authorization;
  var bearer_words = bearer.split(" ");
  if (bearer_words[0] != 'Bearer') {
    log('Incorrect header', bearer_words[0]);
    return;
  } else {
    log('Header available');
  }
  
  let accessToken = bearer_words[1];
  log('Access token', accessToken);
  event.accessToken = accessToken;
}

/**
 * This method is invoked when we receive a "Discovery" message from a Google Home smart action.
 * We are expected to respond back with a list of appliances that we have discovered for a given
 * customer.
 */
function handleDiscovery(event, context) {
  log('Handle discovery', event);
  getAccessToken(event);
  getUserId(event, context);
}

function getUserId(event, context) {
  
  let options = {
    hostname: config.REMOTE_CLOUD_HOSTNAME,
    port: 443,
    path: config.REMOTE_CLOUD_BASE_PATH + '/users/me' + '?access_token=' + event.accessToken,
    headers: {
      accept: 'application/json'
    }
  };

  let responseHandler = getUserIdHandler(event, context);
  let errorHandler = util.getErrorHandler(context);

  /**
   * Make an HTTPS call to remote endpoint.
   */
  https.get(options, responseHandler)
    .on('error', errorHandler).end();
}

function getUserIdHandler(event, context) {
  let serverErrorHandler = util.getErrorHandler(context);

  return function handleResponse(response) {
    if (response.statusCode < 199 || response.statusCode > 299) {
      let error = [];
      error.message = "Status code: " + response.statusCode;
      if (response.statusCode === 401) {
        error.message += ". Please use the right token.";
      } else if (response.statusCode === 500) {
        error.message += ". Please use the right arguments.";
      } else if (response.statusCode === 403) {
        error.message += ". Please, check if your token is correct and check your scope permissions";
      }
      serverErrorHandler(error);
      return;
    }

    let body = '';

    response.on('data', function(chunk) {
      body += chunk.toString('utf-8');
    });

    response.on('end', function() {

      let user = JSON.parse(body);
      
      event.agentUserId = user.id;

      getDevices(event, context);
      
      //log('Get devices', JSON.stringify(result));
      //context.succeed(result);
    });

    response.on('error', serverErrorHandler);
  };
}


function getDevices(event, context) {
  
  log('Get devices');
  
  let options = {
    hostname: config.REMOTE_CLOUD_HOSTNAME,
    port: 443,
    path: config.REMOTE_CLOUD_BASE_PATH + '/Stones/all' + '?access_token=' + event.accessToken,
    headers: {
      accept: 'application/json'
    }
  };

  let responseHandler = getResponseHandler(event, context);
  let errorHandler = util.getErrorHandler(context);

  /**
   * Make an HTTPS call to remote endpoint.
   */
  https.get(options, responseHandler)
    .on('error', errorHandler).end();
}

function getResponseHandler(event, context) {
  let serverErrorHandler = util.getErrorHandler(context);

  return function handleResponse(response) {
    if (response.statusCode < 199 || response.statusCode > 299) {
      let error = [];
      error.message = "Status code: " + response.statusCode;
      if (response.statusCode === 401) {
        error.message += ". Please use the right token.";
      } else if (response.statusCode === 500) {
        error.message += ". Please use the right arguments.";
      } else if (response.statusCode === 403) {
        error.message += ". Please, check if your token is correct and check your scope permissions";
      }
      serverErrorHandler(error);
      return;
    }

    let body = '';

    response.on('data', function(chunk) {
      body += chunk.toString('utf-8');
    });

    response.on('error', serverErrorHandler);

    response.on('end', function() {

      /**
       * Response body will be an array of discovered devices.
       */
      let devices = [];

      let stones = JSON.parse(body);

      /**
       * Getting appliance information in Amazon/Alexa format
       */
      for (let i = 0; i < stones.length; i++) {
        let stone = stones[i];
        let stoneDevice = {
          id: stone.id,
          type: 'action.devices.types.OUTLET',
          traits: [ "action.devices.traits.OnOff" ],
          name: {
            defaultNames: [ stone.name ],
            name: stone.name,
          },
          willReportState: false,
          attributes: {
            commandOnlyOnOff: true
          },
          deviceInfo: {
            manufacturer: 'Crownstone',
            model: stone.type,
            hwVersion: stone.hardwareVersion,
            swVersion: stone.firmwareVersion,
          },
          customData: {
            tapToToggle: stone.tapToToggle,
            onlyOnWhenDark: stone.onlyOnWhenDark,
            locked: stone.locked,
            switchCraft: stone.switchCraft,
          }
        };
        if (stone.dimmingEnabled) {
          stoneDevice.traits.push("action.devices.traits.Brightness");
        }
        devices.push(stoneDevice);
      }

      let requestId = event.requestId;

      let result = {
          requestId: requestId,
          payload: {
            agentUserId: event.agentUserId,
            devices: devices
        }
      };

      log('Send back discovery', JSON.stringify(result));
      context.succeed(result);
    });
  };
}

module.exports = {
  handle: handleDiscovery
};
