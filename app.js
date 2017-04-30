var express = require('express');
var User    = require('./models/users');
var router  = express.Router();
var app     = express();
var http    = require('http');
var request = require('request');
module.exports = router;

app.get('/', function(req, res) {
  if (req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === 'hello') {  // -----------------waiting to deploy to get VERIFY_TOKEN
    console.log("Validating webhook");
    res.status(200).send(req.query['hub.challenge']);
  } else {
    console.error("Failed validation. Make sure the validation tokens match.");
    res.sendStatus(403);          
  }  
});


app.post('/', function (req, res) {
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

  User.findOne({ fbId : senderID } , function(err, user) {
            if (err)
                res.send(err);
            else
            {
              if(!user){
                var user = new User();
                user.fbId= senderID;
                user.save(function(err) {
                  if (err)
                      console.log(err);
                   else
                      res.json({ message: 'User created!' });
              });
                sendTextMessage(senderID,'Hello, welcome to compete bot!\nHere you can subscribe to get notifications about upcoming codeforces contest\n. To subscribe write "handle: your_handle"\n You can update it anytime by sending the same message');
              }
              else{
                //handle user messages
                var messageId = message.mid;
            var messageText = message.text;
            var messageAttachments = message.attachments;

            if(messageText.length()>6){
              if(messageText.substring(0,8).equals('handle: ')){
                //check for correctness of handle
                
               request({
                    url: 'http://codeforces.com/api/user.info?handles='+handle,
                    method: 'GET',
                    // json: {
                    //   recipient: {id:sender},
                    //   message: messageData,
                    // }
                  }, function(error, response, body) {

                    if (error) {
                      console.log('Error sending messages: ', error)
                    } else if (response.body.error) {
                      console.log('Error: ', response.body.error)
                    }
                    else{ 

                      obj = JSON.parse(body);
                      if(obj.status==='FAILED'){
                      sendTextMessage(senderID, 'Handle does not exist. Please try again');
                      return;
                    }
                    else {
                      user.cfHandle= handle;
                      user.save(function(err) {
                         if (err)
                            console.log(err);
                          else
                            res.json({ message: 'hanlde updated' });
                      //----------------------------------------start handling the subscription phase
              });
                    }

                  }
              });
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






