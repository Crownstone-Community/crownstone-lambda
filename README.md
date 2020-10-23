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

## Logging

The logs can be found in Amazon Cloudwatch. The log streams are quite annoying. Sometimes a new log stream is created, at other times it is added to an existing log stream. While debugging, make sure you refresh the overview of the log streams as well as the top one. If the latest log stream is not receiving events anymore, it might very well be that a new log stream is created in the overview. Just make sure you refresh everything.

# Conclusion

If you don’t have Crownstones yet, you can get them at the [webshop](https://shop.crownstone.rocks). If you like to know more about this type of technology, subscribe to our in-depth [smart home email updates](https://crownstone.rocks/email-updates/).

Enjoy your voice-controlled home!

## Building

If you want, you can use npm run build to make a zip file that you can upload to aws!


## Common issues:
If the skill is not invoking the AWS lambda, ensure you have defined active regions for all enabled languages.

