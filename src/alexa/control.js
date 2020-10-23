const https = require('https');
const util = require('../util');
const config = require('../config');
const log = require('../log');

/**
 * Control events are processed here.
 * This is called when Alexa requests an action (IE turn off appliance).
 */
function handleControl(event, context) {

  log('Handle control event', JSON.stringify(event));


  let header = event.directive.header;
  let endpoint = event.directive.endpoint;
  let endpointId = endpoint.endpointId;

  /**
   * Fail the invocation if the header is unexpected. This example only demonstrates
   * turn on / turn off, hence we are filtering on anything that is not SwitchOnOffRequest.
   */
  if (header.namespace !== 'Alexa.PowerController' && header.namespace !== 'Alexa.PowerLevelController' || header.name === 'AdjustPowerLevel' ) {
    return context.fail(util.generateControlError('SwitchOnOffRequest', 'UNSUPPORTED_OPERATION', 'Unrecognized operation'));
  }

  //TODO: remove duplicate code
  if (header.namespace === 'Alexa.PowerController') {
    let accessToken = endpoint.scope.token;
    let requestMethod = header.name;
    let basePath = config.REMOTE_CLOUD_BASE_PATH + '/Stones/' + endpointId + '/switch?access_token=' + accessToken;

    let postData = JSON.stringify({type: (requestMethod === 'TurnOn' ? "TURN_ON" : "TURN_OFF")});

    let options = {
      hostname: config.REMOTE_CLOUD_HOSTNAME,
      port: 443,
      path: basePath,
      method: 'POST',
      headers: {
        accept: '*/*',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    console.log(options.method, 'Requesting to', basePath, "with options", options, 'and data', postData);

    let postRequest = https.request(options, getPowerRequestHandler(event, context));

    postRequest.on('error', util.getErrorHandler(context));
    postRequest.write(postData);
    postRequest.end();
  }
  else if (header.namespace === 'Alexa.PowerLevelController') {
    let accessToken = endpoint.scope.token;
    let payload = event.directive.payload;
    let level = payload.powerLevel;
    let basePath = config.REMOTE_CLOUD_BASE_PATH + '/Stones/' + endpointId + '/switch?access_token=' + accessToken;

    let postData = JSON.stringify({type: "PERCENTAGE", percentage: level });

    let options = {
      hostname: config.REMOTE_CLOUD_HOSTNAME,
      port: 443,
      path: basePath,
      method: 'POST',
      headers: {
        accept: '*/*',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    console.log(options.method, 'Requesting to', basePath, "with options", options, 'and data', postData);

    let postRequest = https.request(options, getPowerLevelRequestHandler(event, context, level))
    postRequest.on('error', util.getErrorHandler(context));
    postRequest.write(postData);
    postRequest.end();
  }
}


function getPowerRequestHandler(event, context) {
  return function(response) {
    let body = '';

    response.on('data', function(chunk) {
      body += chunk.toString('utf-8');
    });

    response.on('end', function() {
      console.log("result body", body)
      let header = event.directive.header;
      let endpoint = event.directive.endpoint;

      // get device ID passed in during discovery
      let requestMethod = header.name;
      let responseHeader = header;
      responseHeader.namespace = "Alexa";
      responseHeader.name = "Response";
      responseHeader.messageId = responseHeader.messageId + "-R";
      let powerResult = requestMethod === 'TurnOn' ? "ON" : "OFF";

      let response = {
        context: {
          properties: [{
            namespace: "Alexa.PowerController",
            name: "powerState",
            value: powerResult,
            timeOfSample: new Date().toISOString(),
            uncertaintyInMilliseconds: 500
          }]
        },
        event: {
          header: responseHeader,
          endpoint: endpoint,
          payload: {}
        }
      };

      log('Done with result', JSON.stringify(response));
      context.succeed(response);
    });

    response.on('error', util.getErrorHandler(context));
  }
}

function getPowerLevelRequestHandler(event, context, level) {
  return function(response) {
    let body = '';

    response.on('data', function(chunk) {
      body += chunk.toString('utf-8');
    });

    response.on('end', function() {
      console.log("result body", body)
      let header = event.directive.header;
      let endpoint = event.directive.endpoint;

      let alexaResponse = {
        event: {
          header: {
            namespace: "Alexa",
            name: "Response",
            messageId: header.messageId + "-R",
            correlationToken: header.correlationToken,
            payloadVersion: "3"
          },
          endpoint: {...endpoint},
          payload: {}
        },
        context: {
          properties: [
            {
              namespace: "Alexa.PowerLevelController",
              name: "powerLevel",
              value: level,
              timeOfSample: new Date().toISOString(),
              uncertaintyInMilliseconds: 500
            }
          ]
        }
      }

      log('Done with result', JSON.stringify(alexaResponse));
      context.succeed(alexaResponse);
    });

    response.on('error', util.getErrorHandler(context));
  }
}




module.exports = {
  handle: handleControl
}
