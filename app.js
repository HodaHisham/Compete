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

  User.findOne({ id : req.params.user_id } , function(err, user) {
            if (err)
                res.send(err);
            else
            {
            	if(!user){
            		// first time to message
            	}
            	else{
            		//handle user messages
            	}

             
            }
  });
  // console.log("Received message for user %d and page %d at %d with message:", 
  //   senderID, recipientID, timeOfMessage);
  // console.log(JSON.stringify(message));

  // var messageId = message.mid;

  // var messageText = message.text;
  // var messageAttachments = message.attachments;

  // if (messageText) {

   
  //   switch (messageText) {
  //     case 'generic':
  //       sendGenericMessage(senderID);
  //       break;

  //     default:
  //       sendTextMessage(senderID, messageText);
  //   }
  // } else if (messageAttachments) {
  //   sendTextMessage(senderID, "Message with attachment received");
  // }
}