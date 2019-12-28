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
    //log('Header available');
  }
  
  let accessToken = bearer_words[1];
  //log('Access token', accessToken);
  event.accessToken = accessToken;
}

/**
 * Parse the event to obtain the sequence of commands to be sent. Call 
 * sendCommand for each of these commands.
 */
async function sendCommands(event, context) {
  for (var i=0; i < event.inputs.length; i++) {
    let payload = event.inputs[i].payload;
   
    // there are multiple commands in a single payload
    for (var j = 0; j < payload.commands.length; j++) {
      
      if (j > 0) break; // let's not get carried away, a single command for X devices is enough
      
      let command = payload.commands[j];
     
      let stones = [];
     
      for (var k = 0; k < command.devices.length; k++) {
        let device = command.devices[k];
        stones.push(device.id);
      }
      for (var k = 0; k < command.execution.length; k++) {
        let execution = command.execution[k];
       
        switch(execution.command) {
          case "action.devices.commands.OnOff":
            event.stones = stones;
            event.action_params = execution.params.on;
            //sendCommand(event, context);
            await sendCommand(event, context);
            // how to do this in a loop
            log('Command sent');
          break;
         }
       }
    }
  }
}

/**
 * Send a response back to the Google server.
 */
function sendResponse(event, context) {
  // we will only respond for the first command for now
  let requestId = event.requestId;

  let commands = [];
  
  if (event.stones) {
    let ids = [];
    for (var k = 0; k < event.stones.length; k++) {
        ids.push(event.stones[k]);
    }
    let command = {
      ids: ids,
      status: 'SUCCESS',
      states: {
        on: event.action_params ? true : false,
        online: true
      }
    };
    commands.push(command);

    let result = {
      requestId: requestId,
      payload: {
        agentUserId: event.agentUserId,
        commands: commands
      }
    };

    log('Send back control info', JSON.stringify(result));
    context.succeed(result);
  }
}

/**
 * The function handleControl is called when Google Home requests an action.
 * We call sendCommands asynchronously. Only when it's done we call sendResponse.
 * @TODO Check if we can optimize so that this lambda function uses less time
 */
function handleControl(event, context) {
  //log('Handle control event', JSON.stringify(event));
  getAccessToken(event);
  
  sendCommands(event, context).then(() => {
    sendResponse(event, context);
  });
}

/**
 * Performs the actual PUT request to the Crownstone cloud server.
 * We wrap https.request in a promise, so it can be used with async/await. 
 */
function performRequest(options, context) {
	return new Promise((resolve, reject) => {
		var req = https.request(options, function(response) {
			let body = '';

			if (response.statusCode < 200 || response.statusCode > 300) {
				util.getErrorHandler(context);
				return reject(new Error('Status code=' + response.statusCode));
			}

			response.on('data', function(chunk) {
				body += chunk.toString('utf-8');
			});

			response.on('end', function() {
				// ignore response (there's no body anyway)
				log('Crownstone command sent, response received', body);
				resolve(body);
			});

			// reject on bad status
			response.on('error', function(e) {
				util.getErrorHandler(context);
				return reject(e);
			});
		});

		req.on('error', function(e) {
			// reject on request error
			util.getErrorHandler(context);
			return reject(e);
		});
		req.end();
	});
}

/**
 * The sendCommand should send out the PUT requests in parallel. However, this function 
 * should wait till all events have been executed successfully. This is implemented
 * through a Promise.all construct.
 */
async function sendCommand(event, context) {
		
	let accessToken = event.accessToken;

	const promises = event.stones.map(async(stoneId) => {
		let basePath = config.REMOTE_CLOUD_BASE_PATH + '/Stones/' + stoneId + '/setSwitchStateRemotely?switchState=' + (event.action_params ? 1 : 0) + '&access_token=' + accessToken;

		let options = {
			hostname: config.REMOTE_CLOUD_HOSTNAME,
			port: 443,
			path: basePath,
			method: 'PUT',
			headers: {
				accept: '*/*'
			}
		};

		log('Send a PUT request for stone ' + stoneId);
		//log('Complete path: ', options.hostname + basePath);
		
		await performRequest(options, context)
      .catch(e => 
        util.getErrorHandler(context)
      );

		log('Request for stone ' + stoneId + ' is sent');
	});

  log('Wait till all promises are resolved');
  await Promise.all(promises)
    .catch(e => 
      util.getErrorHandler(context)
    );
	
	log('All commands sent [next batch]');
}

module.exports = {
  handle: handleControl
};
