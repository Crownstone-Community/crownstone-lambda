# Summary

AWS Lambda function for either an Alexa or Google Home voice assistant.

# Explanation

Crownstones react to your presence and can turn on the lights when you enter the room automatically! Now you can 
overrule their behavior by Alexa or Google Home voice commands. For example, tell them to dim the lights when you want 
to watch a movie to create a nice atmosphere! You need physical Crownstones to make this happen. The Crownstones can be 
bought [online](https://shop.crownstone.rocks/).

## Alexa

It is easy to start to use Alexa if you have Crownstones:

+ First, install the [Crownstone app](https://crownstone.rocks/app/) on your phone. The app runs on iPhone and Android 
devices.
+ Register yourself in the Crownstone app and remember your username and password.
+ Configure Crownstones in the app and give them nice names that are easy to pronounce.
+ In the Alexa app, enable the Crownstone skill and fill in the username and password you previously created for 
Crownstone.
+ The names given to the individual Crownstones in the Crownstone app will be the ones you can use with Alexa.
+ You can control the Crownstone devices now via voice commands.
+ You need a smartphone or tablet with the Crownstone app near the Crownstones.
+ If you want to control the Crownstones remotely, install the Crownstone app on a tablet or second smartphone and 
leave it at home. It now functions as a hub!

Technically, this is what will happen when you say “Alexa, turn on the living room light”. The voice command is 
recognized by Alexa, it then goes to the Amazon servers, initiates a request to the Crownstone cloud, sends a push 
message via Apple/Google to your iPhone or Android device, which will then control the Crownstones.

## Google Home

Google Home is not officially released yet. It has been partly implemented. First of all, in the Actions console, a fulfillment URL is specified. This is an URL of an Amazon REST API which functions as an interface to the Lambda function. 

There are several intents implemented. The documentation on how to process intents can be found [here](https://developers.google.com/assistant/smarthome/develop/process-intents).

There are four intents:

* action.devices.SYNC
* action.devices.QUERY
* action.devices.EXECUTE
* action.devices.DISCONNECT

The ones that are implemented for now are the SYNC and the EXECUTE intents. The [SYNC](https://developers.google.com/assistant/smarthome/reference/rest/v1/devices/sync) intent is a discovery process. It returns a list of Crownstones devices to be used from your Google Home. You can use the [validator](https://developers.google.com/assistant/smarthome/tools/validator) to check if the format is actually correct. The EXECUTE intent can be used to actually turn on/off or dim devices.

There are certain fields ignored by our system. For example, we do not know if a particular device is actually plugged in. This information is not available in our cloud. We therefore do always set a device to "online" and never return a status "OFFLINE". 

The [QUERY](https://developers.google.com/assistant/smarthome/reference/rest/v1/devices/query) intent has not been implemented. It returns only state information. So, it would be completely useless in our case. However, it might be necessary to have it implemented from Google's perspective.

The DISCONNECT intent does not have any impact. Accept when we also implement the following functionality.

There's one thing quite different from Amazon and that is that Google requires you to push messages to its cloud as well. This is quite annoying and privacy-sensitive. Do we really want to inform Google every time that the state of a Crownstone has changed? However, it states quite clearly that it is required before an action can be deployed:

[Request Sync](https://developers.google.com/assistant/smarthome/develop/request-sync), this is a trigger to update the "HomeGraph", the list of devices in your home. It has to be triggered after adding/removing a device. After the request, a new SYNC request will be sent to the lambda function.

[Report State](https://developers.google.com/assistant/smarthome/develop/report-state), this is a regular update that tells Google what the state of a device is. Google wants this information so bad that it actually disregards status information obtained through a QUERY or EXECUTE request. 

Hence, Crownstone has to implement those services as well. However, we can subsequently give the user the option to have this information communicated to Google or not. The most logical place is the "connection" part in the Crownstone app. 


## Logging

The logs can be found in Amazon Cloudwatch. The log streams are quite annoying. Sometimes a new log stream is created, at other times it is added to an existing log stream. While debugging, make sure you refresh the overview of the log streams as well as the top one. If the latest log stream is not receiving events anymore, it might very well be that a new log stream is created in the overview. Just make sure you refresh everything.

# Conclusion

If you don’t have Crownstones yet, you can get them at the [webshop](https://shop.crownstone.rocks). If you like to know more about this type of technology, subscribe to our in-depth [smart home email updates](https://crownstone.rocks/email-updates/).

Enjoy your voice-controlled home!

