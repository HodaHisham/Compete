var express = require('express');
var User    = require('../models/users');
var router  = express.Router();
var app     = express();

app.get('/webhook', function(req, res) {
  if (req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === <VERIFY_TOKEN>) {  // -----------------waiting to deploy to get VERIFY_TOKEN
    console.log("Validating webhook");
    res.status(200).send(req.query['hub.challenge']);
  } else {
    console.error("Failed validation. Make sure the validation tokens match.");
    res.sendStatus(403);          
  }  
});


app.post('/webhook', function (req, res) {
  var data = req.body;

  // Make sure this is a page subscription
  if (data.object === 'page') {

    // Iterate over each entry - there may be multiple if batched
    data.entry.forEach(function(entry) {
      var pageID = entry.id;
      var timeOfEvent = entry.time;

      // Iterate over each messaging event
      entry.messaging.forEach(function(event) {
        if (event.message) {
          receivedMessage(event);
        } else {
          console.log("Webhook received unknown event: ", event);
        }
      });
    });

    
    res.sendStatus(200);
  }
});

function receivedMessage(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;

  User.findOne({ fb_id : senderID } , function(err, user) {
            if (err)
                res.send(err);
            else
            {
            	if(!user){
            		var user = new User();
            		user.fb_id= senderID;
            		user.save(function(err) {
            			if (err)
                			console.log(err);
           				 else
                			res.json({ message: 'User created!' });
        			});
            		sendTextMessage(senderID,'Hello, welcome to compete bot!\nHere you can subscribe to get notifications about upcoming codeforces contest\n. To subscribe write "handle: your_handle"');
            	}
            	else{
            		//handle user messages
            		var messageId = message.mid;
  					String messageText = message.text.toString();
  					var messageAttachments = message.attachments;

  					if(messageText.length()>6){
  						if(messageText.substring(0,8).equals('handle: ')){
  							//check for correctness of handle
						}

  					}
  						}


            	}

             
            }
  });
}

  function sendTextMessage(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText
    }
  };

  callSendAPI(messageData);
}

function callSendAPI(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: PAGE_ACCESS_TOKEN },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      console.log("Successfully sent generic message with id %s to recipient %s", 
        messageId, recipientId);
    } else {
      console.error("Unable to send message.");
      console.error(response);
      console.error(error);
    }
  });  
}






