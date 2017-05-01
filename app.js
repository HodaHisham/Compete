var express = require('express');
var User    = require('./models/users');
var http    = require('http');
var request = require('request');
var router  = express.Router();
var Contest = require('./models/contests');
var called = false;

router.get('/', function(req, res) {
  if (req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === process.env.VERIFY_TOKEN) {
    console.log('Validating webhook');
    res.status(200).send(req.query['hub.challenge']);
    if(!called) {
    getContests(true);
    getContests(false);
    called = true;
    }
  } else {
    console.error('Failed validation. Make sure the validation tokens match.');
    res.sendStatus(403);
  }
});


router.post('/', function(req, res) {
  console.log('entered post of webhook');
  var data = req.body;
  console.log(called);
  if(!called) {
    getContests(true);
    console.log('here');

    getContests(false);
    called = true;
  }
  res.sendStatus(200);
  // Make sure this is a page subscription
  if (data.object === 'page') {
    // Iterate over each entry - there may be multiple if batched
    data.entry.forEach(function(entry) {
      var pageID = entry.id;
      var timeOfEvent = entry.time;

      // Iterate over each messaging event
      entry.messaging.forEach(function(event) {
        if (event.message) {
              console.log('entered event message');

          receivedMessage(event);
        } else {
          console.log('Webhook received unknown event: ', event);
        }
      });
    });
  }
});

function receivedMessage(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;

  User.findOne({fbId: senderID}, function(err, user) {
            if (err)
                console.log(err);
            else {
              if(!user) {
                var user = new User();
                user.fbId= senderID;
                user.save(function(err) {
                  if (err)
                      console.log(err);
                   else
                      console.log('User created!');
              });

                sendTextMessage(senderID, 'Hello, welcome to compete bot!\nHere you can subscribe to get notifications about upcoming codeforces contest\n. To subscribe write "handle: your_handle"\n You can update it anytime by sending the same message');
              } else{
                //handle user messages
                var messageId = message.mid;
                var messageText = message.text;
                var messageAttachments = message.attachments;

            if(messageText.length>5) {
                if(messageText.substring(0,5)=='sub: ') {
                  if(messageText.indexOf('div1') !== -1) {
                      user.div1= true;
                  }
                  if(messageText.indexOf('div2') !== -1) {
                      user.div2= true;
                  }

                  if(messageText.indexOf('gym') !== -1) {
                      user.gym= true;
                  }
                  user.save(function(err) {
                    if (err)
                      console.log(err);
                    else{
                      console.log('User created!');
                      sendTextMessage(senderID, 'Subscribed Successfully\nto unsubscribe any of them use the same message but with unsub:');
                    }
                   });
                  return;
                }
                if(messageText.substring(0,7) =='unsub: ') {
                  if(messageText.indexOf('div1') !== -1){
                      user.div1= false;
                  }
                  if(messageText.indexOf('div2') !== -1) {
                      user.div2= false;
                  }
                  if(messageText.indexOf('gym') !== -1) {
                      user.gym= false;
                  }
                  user.save(function(err) {
                    if (err)
                      console.log(err);
                    else{
                      console.log('User created!');
                      sendTextMessage(senderID, 'Unsubscribed Successfully');
                    }
                   });
                  return;
                }

              if(messageText.length>8) {
                if(messageText.substring(0, 8) =='handle: ') {
                  // check for correctness of handle
                   var handle = messageText.slice(8);
                   request({
                      url: 'http://codeforces.com/api/user.info?handles='+handle,
                      method: 'GET',

                    }, function(error, response, body) {
                    if (error) {
                      console.log('Error sending messages: ', error)
                    } else if (response.body.error) {
                      console.log('Error: ', response.body.error)
                    } else {
                      obj = JSON.parse(body);
                      if(obj.status === 'FAILED') {
                      sendTextMessage(senderID, 'Handle does not exist. Please try again');
                      return;
                    } else {
                      user.cfHandle = handle;
                      user.save(function(err) {
                         if (err)
                            console.log(err);
                          else
                            console.log('handle updated');

                          sendTextMessage(senderID, 'Welcome '+handle + '\nNow you can subscribe to be notified to different codeforces contests\nTo subscribe copy and paste the following and remove unwanted subscriptions\nsub: div1 div2 gym\n');
                      });
                    }
                  }
              });
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
    qs: {access_token: process.env.PAGE_ACCESS_TOKEN},
    method: 'POST',
    json: messageData

  }, function(error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      console.log('Successfully sent generic message with id %s to recipient %s',
        messageId, recipientId);
    } else {
      console.error('Unable to send message.');
      console.error(response);
      console.error(error);
    }
  });
}

function getContests(gym) {
  setInterval(function() {
    // Assign the HTTP request host/path
      request({
         url: 'http://codeforces.com/api/contest.list?gym='+gym,
         method: 'GET',
        }, function(error, response, body) {
           if (error) {
             console.log('Error sending messages: ', error)
           } else if (response.body.error) {
             console.log('Error: ', response.body.error)
           } else{
             obj = JSON.parse(body);
             if(obj.status === 'OK') {
               var array = obj.result;
               var len = array.length, i;
               for(i = 0; i < len; i++) {
                 var item = array[i];
                 var ann = false;
                 Contest.findOne({conId: item.id}, function(err, con) {
                  if(err) {
                    ann = true;
                    con = new Contest();
                    con.conId = item.id;
                    con.div1 = item.name.indexOf('div1') != -1;
                    con.div2 = item.name.indexOf('div2') != -1;
                    con.gym = gym;
                    con.rem24H = false;
                    con.rem1H = false;
                    con.sysTestSt = false;
                    con.sysTestEnd = false;
                    con.ratingCh = false;
                  }
                  User.find({}).stream().on('data', function(user) {
                    if(ann && user.gym && con.gym)
                     sendTextMessage(user.fbId, 'A new gym contest is announced! ' + item.name + ' will take place after '
                     + (item.relativeTimeSeconds / 86400) + ' day(s) ' + ((item.relativeTimeSeconds % 86400) / 3600) + ' hour(s) ' +
                     (((item.relativeTimeSeconds % 86400) % 3600) / 60) + ' min(s) '
                     );
                   else if(ann && user.div1 && con.div1)
                    sendTextMessage(user.fbId, 'A new div1 contest is announced! ' + item.name + ' will take place after '
                    + (item.relativeTimeSeconds / 86400) + ' day(s) ' + ((item.relativeTimeSeconds % 86400) / 3600) + ' hour(s) ' +
                    (((item.relativeTimeSeconds % 86400) % 3600) / 60) + ' min(s) '
                    );
                   else if(ann & user.div2 && con.div2)
                    sendTextMessage(user.fbId, 'A new div2 contest is announced! ' + item.name + ' will take place after '
                    + (item.relativeTimeSeconds / 86400) + ' day(s) ' + ((item.relativeTimeSeconds % 86400) / 3600) + ' hour(s) ' +
                    (((item.relativeTimeSeconds % 86400) % 3600) / 60) + ' min(s) '
                    );
                   if(!con.rem24H && item.relativeTimeSeconds >= -86400000) {
                      con.rem24H = true;
                      sendTextMessage(user.fbId, 'Reminder: ' + item.name + ' will take place in 24 hours');
                    }
                   if(!con.rem1H && item.relativeTimeSeconds >= -3600000) {
                      con.rem1H = true;
                      sendTextMessage(user.fbId, 'Reminder: ' + item.name + ' will take place in 1 hour');
                    }
                   if(!con.sysTestSt && item.phase === 'SYSTEM_TEST') {
                      con.sysTestSt = true;
                      sendTextMessage(user.fbId, 'System Testing for ' + con.name + ' has started!');
                    }
                    if(con.sysTestSt && !con.sysTestEnd && item.phase === 'FINISHED') {
                       con.sysTestEnd = true;
                       monitorRating(item.id, con);
                       sendTextMessage(user.fbId, 'System Testing for ' + con.name + ' has ended!');
                     }
                  });
                  con.save(function(err) {
                      if (err)
                          console.log(err);
                      else
                          console.log({message: 'Contest updated/created!'});
                  });
              });
           }
         }
       }
    });
  }, 60000);
};


function monitorRating(id, con) {
  var interv = setInterval(function() {
    request({
          url: 'http://codeforces.com/api/contest.ratingChanges?contestId='+id,
          method: 'GET'
        }, function(error, response, body) {
          if (error) {
            console.log('Error sending messages: ', error)
          } else if (response.body.error) {
            console.log('Error: ', response.body.error)
          } else {
            obj = JSON.parse(body);
            if(obj.status === 'FAILED') {
            console.log('Rating changes are not available', error);
            } else {
                var array = obj.result;
                var len = array.length, i;
                for(i = 0; i < len; i++) {
                  var item = (array[i]);
                  console.log(item);
                  User.findOne({cfHandle: item.handle}, function(err, user) {
                   if(!err) {
                     sendTextMessage(user.fbId, item.newRating > item.oldRating?
                      'Congrats! You earned ' + (item.newRating - item.oldRating)
                      + ' rating points':'You lost '+ (item.oldRating - item.newRating)
                      + 'points! I know you can do it next time! Keep up the hard work :D');
                   }
                 });
               }
              clearInterval(interv);
              con.ratingCh = true;
            }
        }
    });
  }, 60000);
};

module.exports = router;
