'use strict';

const https = require('https');
const util = require('../util');
const config = require('../config');
const log = require('../log');

/**
 * This method is invoked when we receive a "Discovery" message from Alexa Smart Home Skill.
 * We are expected to respond back with a list of appliances that we have discovered for a given
 * customer.
 */
function handleDiscovery(event, context) {

  log('Handle discovery function', event.directive.payload.scope.token);

  let accessToken = event.directive.payload.scope.token;

  let options = {
    hostname: config.REMOTE_CLOUD_HOSTNAME,
    port: 443,
    path: config.REMOTE_CLOUD_BASE_PATH + '/Stones/all?filter={"include":["location",{"abilities":"properties"}]}&access_token=' + accessToken,
    headers: {
      accept: 'application/json'
    }
  };


  let responseHandler = getResponseHandler(event,context);
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

    response.on('end', function() {

      /**
       * Response body will be an array of discovered devices.
       */
      let endpoints = [];

      let stones = JSON.parse(body);

      /**
       * Getting appliance information in Amazon/Alexa format
       */
      for (let i = 0; i < stones.length; i++) {
        let stone = stones[i];

        let stoneEndpoint = generateStoneEntry(stone);
        endpoints.push(stoneEndpoint);
      }

      let header = event.directive.header;
      header.name = "Discover.Response";

      let result = {
        event: {
          header: header,
          payload: {
            endpoints: endpoints
          }
        }
      };

      log('Discovery', JSON.stringify(result));
      context.succeed(result);
    });

    response.on('error', serverErrorHandler);
  };
}


const powerStateCapability = {
  type: "AlexaInterface",
  interface: "Alexa.PowerController",
  version: "3",
  properties: {
    supported: [{
      name: "powerState"
    }],
    proactivelyReported: true,
    retrievable: false
  }
};

const powerLevelCapability = {
  type: "AlexaInterface",
  interface: "Alexa.PowerLevelController",
  version: "3",
  properties: {
    supported: [{name: "powerLevel"}],
    proactivelyReported: true,
    retrievable: false
  }
};


function generateStoneEntry(stone) {
  let canDim = false;
  for (let j = 0; j < stone.abilities.length; j++) {
    if (stone.abilities[j].type === 'dimming') {
      if (stone.abilities[j].enabled === true) {
        canDim = true;
      }
      break;
    }
  }

  let cookie = {
    address: stone.address,
    sphere:  stone.sphereId,
    dimmable: canDim,
  };

  let locationName = stone.location && stone.location.name || null;
  let stoneDescription = stone.description;
  let description = util.prettifyDeviceType(stone.type);
  if (locationName) {
    description += " in " + locationName;
  }
  if (stoneDescription) {
    description += '\n'+stoneDescription;
  }

  let info = {
    endpointId: stone.id,
    manufacturerName: 'Crownstone',
    description: description,
    friendlyName: stone.name,
  }

  let stoneEndpoint
  if (canDim) {
    stoneEndpoint = {
      ...info,
      displayCategories: ["LIGHT"],
      cookie: cookie,
      capabilities: [
        powerLevelCapability,
        powerStateCapability
      ],
    };
  }
  else {
    stoneEndpoint = {
      ...info,
      displayCategories: ["SWITCH"],
      cookie,
      capabilities: [powerStateCapability],
    };
  }
  return stoneEndpoint;
}


module.exports = {
  handle: handleDiscovery
};