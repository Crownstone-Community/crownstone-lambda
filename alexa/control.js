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
  if (header.namespace != 'Alexa.PowerController' ) {
    context.fail(util.generateControlError('SwitchOnOffRequest', 'UNSUPPORTED_OPERATION', 'Unrecognized operation'));
  }

  if (header.namespace === 'Alexa.PowerController') {

    let accessToken = endpoint.scope.token;
    let requestMethod = header.name;
    let basePath = config.REMOTE_CLOUD_BASE_PATH + '/Stones/' + endpointId + '/setSwitchStateRemotely?switchState=' + (requestMethod === 'TurnOn' ? 1 : 0) + '&access_token=' + accessToken;

    log('basePath', basePath);

    let options = {
      hostname: config.REMOTE_CLOUD_HOSTNAME,
      port: 443,
      path: basePath,
      method: 'PUT',
      headers: {
        accept: '*/*'
      }
    };

    https.request(options, getRequestHandler(event, context))
      .on('error', util.getErrorHandler(context)).end();
  }
}


function getRequestHandler(event, context) {
  return function(response) {
    let body = '';

    response.on('data', function(chunk) {
      body += chunk.toString('utf-8');
    });

    response.on('end', function() {

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




module.exports = {
  handle: handleControl
}
