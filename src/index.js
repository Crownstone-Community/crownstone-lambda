'use strict';

const log = require('./log');
const alexa_discovery = require('./alexa/discovery');
const alexa_control = require('./alexa/control');

/**
 * Main entry point.
 * Incoming events from Alexa Lighting APIs are processed via this method.
 */
exports.handler = function(event, context) {

  //log('Incoming event', JSON.stringify(event));

  //log('Context', JSON.stringify(context));

  if (event.directive) {
    
    let header = event.directive.header;
    
    switch (header.namespace) {
      /**
       * The namespace of "Discovery" indicates a request is being made to the lambda for
       * discovering all appliances associated with the customer's appliance cloud account.
       * can use the accessToken that is made available as part of the payload to determine
       * the customer.
       */
      case 'Alexa.Discovery':
        alexa_discovery.handle(event, context);
        break;

      /**
      * The namespace of "Control" indicates a request is being made to us to turn a
      * given device on, off or brighten. This message comes with the "appliance"
      * parameter which indicates the appliance that needs to be acted on.
      */
      case 'Alexa.PowerLevelController':
      case 'Alexa.PowerController':
        alexa_control.handle(event, context);
        break;

      /**
       * We received an unexpected message
       */
      default:
        log('Err', 'No supported namespace in directive: ' + JSON.stringify(header));
        context.fail('Something went wrong');
        break;
    }
  }
};


