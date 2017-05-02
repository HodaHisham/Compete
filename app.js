var express = require('express');
var User = require('./models/users');
var request = require('request');
var router = express.Router();
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
      console.log('here');
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
      // var pageID = entry.id;
      // var timeOfEvent = entry.time;

      // Iterate over each messaging event
      entry.messaging.forEach(function(event) {
        if (event.message) {
          console.log('entered event message');
          receivedMessage(event);
        } else if (event.postback) {
              console.log('entered event postback');
              receivedPostback(event);
        } else {
          console.log('Webhook received unknown event: ', event);
        }
      });
    });
  }
});

function receivedPostback(event) {
  var senderID = event.sender.id;
  // var recipientID = event.recipient.id;
  // var timeOfMessage = event.timestamp;
  var postback = event.postback;
  var payload= postback.payload;

  if(payload =='startButton') {
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
              } else{
                // user wants to begin from scratch
                  user.fbId = senderID;
                  user.div1 = false;
                  user.div2 = false;
                  user.gym = false;
                  user.save(function(err) {
                    if (err)
                        console.log(err);
                     else
                        console.log('User created!');
                  });
              }
          }
      });
    sendTextMessage(senderID, 'Hello, welcome to compete bot!\nHere you can subscribe to get notifications about upcoming codeforces contest\n. To subscribe write "handle: your_handle"\n You can update it anytime by sending the same message');
  }
}

function receivedMessage(event) {
  var senderID = event.sender.id;
  // var recipientID = event.recipient.id;
  // var timeOfMessage = event.timestamp;
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
                  // handle user messages
                  // var messageId = message.mid;
                  var messageText = message.text;
                  // var messageAttachments = message.attachments;

                  if(messageText.length > 5) {
                  if(messageText.substring(0, 5) == 'sub: ') {
                    handleSubscriptions(user, messageText, true);
                    return;
                  } else
                    if(messageText.length > 7)
                      if(messageText.substring(0, 7) == 'unsub: ') {
                          handleSubscriptions(user, messageText, false);
                          return;
                      } else
                        if(messageText.length > 8) {
                          console.log('entered handling handles');
                          if(messageText.substring(0, 8) == 'handle: ') {
                            // check for correctness of handle
                            var handle = messageText.slice(8);
                            request({
                              url: 'http://codeforces.com/api/user.info?handles='+handle,
                              method: 'GET'

                            }, function(error, response, body) {
                            if (error) {
                              console.log('Error sending messages: ', error);
                            } else if (response.body.error) {
                              console.log('Error: ', response.body.error);
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
                    } else
                      handleWrongMessage(senderID, messageText);
                } else
                  handleWrongMessage(senderID, messageText);
              }
           }
    });
}

  function handleWrongMessage(senderID, messageText) {
    sendTextMessage(senderID, 'Sorry I don\'t understand :(\nTo update your handle, type handle: my_handle\nTo subscribe, write sub: div1 div2 gym\nTo unsubscribe, write unsub: div1 div2 gym\n');
  }


  function handleSubscriptions(user, messageText, sub) {
    if(messageText.indexOf('div1') !== -1) {
      user.div1= sub;
    }
    if(messageText.indexOf('div2') !== -1) {
        user.div2= sub;
    }
    if(messageText.indexOf('gym') !== -1) {
        user.gym= sub;
    }
    user.save(function(err) {
      if (err)
        console.log(err);
      else {
        if(sub)
          sendTextMessage(user.fbId, 'Subscribed Successfully');
        else
          sendTextMessage(user.fbId, 'Unsubscribed Successfully');
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
    // var gym = req.params.gym;
      request({
        //  url: 'http://codeforces.com/api/contest.list?gym='+gym,
         url: 'https://sheltered-reef-68226.herokuapp.com/',
         method: 'GET'
        }, function(error, response, body) {
           if (error) {
             console.log('Error sending messages: ', error);
           } else if (response.body.error) {
             console.log('Error: ', response.body.error);
           } else{
             obj = JSON.parse(body);
             if(obj.status === 'OK') {
               Contest.count({}, function( err, count) {
                 processContest(obj.result, 0, gym, count !== 0);
               });
             }
           }
         });
  }, 60000*3);
};

function processContest(array, ind, gym, ann) {
  if(ind == array.length)
    return;
  var item = array[ind];
  if(!item)
    return;
  // console.log(item);
    Contest.findOne({conId: item.id}, function(err, con) {
     if(err || !con) {
      //  console.log('ann: ' + ann);
      //  console.log('gym: ' + gym);
      con = new Contest();
      var categorySpecified = false;
      con.conId = item.id;
      if(item.name.indexOf('Div.1') !== -1 || item.name.indexOf('Div. 1') !== -1) {
        con.div1 = true;
        categorySpecified = true;
      }
      if(item.name.indexOf('Div.2') !== -1 || item.name.indexOf('Div. 2') !== -1) {
        con.div2 = true;
        categorySpecified = true;
      }
      if(gym) {
        con.gym = true;
        categorySpecified = true;
      }
      if(!categorySpecified) {
        con.div1 = true;
        con.div2 = true;
      }
      con.rem24H = typeof item.relativeTimeSeconds == 'undefined';
      con.rem1H = typeof item.relativeTimeSeconds == 'undefined';
      con.sysTestSt = false;
      con.sysTestEnd = false;
      con.ratingCh = false;
     } else ann = false;
     console.log(con);
     var categorySpecified = false;
     con.conId = item.id;
     if(item.name.indexOf('Div.1') !== -1 || item.name.indexOf('Div. 1') !== -1) {
       con.div1 = true;
       categorySpecified = true;
     }
     if(item.name.indexOf('Div.2') !== -1 || item.name.indexOf('Div. 2') !== -1) {
       con.div2 = true;
       categorySpecified = true;
     }
     if(gym) {
       con.gym = true;
       categorySpecified = true;
     }
     if(!categorySpecified) {
       con.div1 = true;
       con.div2 = true;
     }
     var rem24 = false, rem1 = false, systS = false, systE = false;
     var remainingTime = Math.floor(-item.relativeTimeSeconds / 86400) + ' day(s) ' + Math.floor((-item.relativeTimeSeconds % 86400) / 3600) + ' hour(s) ' +
     Math.floor(((-item.relativeTimeSeconds % 86400) % 3600) / 60) + ' min(s) ';
     console.log(remainingTime);
     if(!con.rem1H && item.relativeTimeSeconds >= -3600 && item.relativeTimeSeconds < 0) {
        rem1 = true;
        con.rem1H = true;
        // console.log('Reminder: ' + item.name + ' will take place in 1 hour');
      } else if(!con.rem1H && !con.rem24H && item.relativeTimeSeconds >= -86400*3 && item.relativeTimeSeconds < 0) {
         rem24 = true;
         con.rem24H = true;
        //  console.log('Reminder: ' + item.name + ' will take place in 24 hours');
      }
      if(!con.sysTestSt && item.phase === 'SYSTEM_TEST') {
        systS = true;
        con.sysTestSt = true;
        // console.log('System Testing for ' + item.name + ' has started!');
      }
      if(con.sysTestSt && !con.sysTestEnd && item.phase === 'FINISHED') {
        systE = true;
        con.sysTestEnd = true;
        if(!gym)
          monitorRating(item.id);
        //  console.log('System Testing for ' + item.name + ' has ended!');
      }
      con.save(function(err) {
            // if (err)
            //     console.log(err);
            // else
            //     console.log({message: 'Contest updated/created!'});
        User.find({}).cursor().on('data', function(user) {
         if(!user)
           return;
        //  console.log(user);
         var interested = false;
         if(ann) {
           if(user.gym && con.gym) {
              interested = true;
              sendTextMessage(user.fbId, 'A new gym contest is announced! ' + item.name + ' will take place after ' + remainingTime);
            } else if(user.div1 && con.div1) {
               interested = true;
               sendTextMessage(user.fbId, 'A new div1 contest is announced! ' + item.name + ' will take place after ' + remainingTime);
            } else if(user.div2 && con.div2) {
               interested = true;
               sendTextMessage(user.fbId, 'A new div2 contest is announced! ' + item.name + ' will take place after ' + remainingTime);
            }
          }
          console.log('interested ' + interested);
          if(interested) {
            if(rem24)
              sendTextMessage(user.fbId, 'Reminder: ' + item.name + ' will take place in 24 hours');
            if(rem1)
              sendTextMessage(user.fbId, 'Reminder: ' + item.name + ' will take place in 1 hour');
            if(systS)
              sendTextMessage(user.fbId, 'System Testing for ' + item.name + ' has started!');
            if(systE)
              sendTextMessage(user.fbId, 'System Testing for ' + item.name + ' has ended!');
          }
          // console.log(con);
         }).on('end', function() {
           processContest(array, ind+1, gym, ann);
         });
      //  } else
      //   processContest(array, ind+1, gym, ann);
      });
     });
 }
 var interv = function(id) {
   setInterval(function() {
   console.log('entered rating');
   request({
         // url: 'http://codeforces.com/api/contest.ratingChanges?contestId='+id,
         url: 'https://sheltered-reef-68226.herokuapp.com/rating',
         method: 'GET'
       }, function(error, response, body) {
         if (error) {
           console.log('Error sending messages: ', error);
         } else if (response.body.error) {
           console.log('Error: ', response.body.error);
         } else {
           var obj = JSON.parse(body);
           if(obj.status === 'FAILED') {
             console.log('Rating changes are not available', error);
           } else {
               var array = obj.result;
               handleRating(array, 0, id);
           }
       }
   });
 }, 60000*3);
}

function monitorRating(id) {
   interv(id);
 };

function handleRating(array, ind, contestId) {
  var item;
  if(ind == array.length || !array[ind]) {
    clearInterval(interv);
    Contest.findOne({conId: contestId}, function(err, con) {
      con.ratingCh = true;
      con.save(function(err) {
            // if (err)
            //     console.log(err);
            // else
            //     console.log({message: 'Contest updated/created!'});
      });
    });
    return;
  }
  item = array[ind];
  console.log(item);
  User.find({}).cursor().on('data', function(user) {
   if(!user) {
     sendTextMessage(user.fbId, item.newRating > item.oldRating?
      'Congrats! You earned ' + (item.newRating - item.oldRating)
      + ' rating points in ' + item.contestName:'You lost '+ (item.oldRating - item.newRating)
      + ' rating points in ' + item.contestName + '. I know you can do it next time! Keep up the hard work :D');
   }
 }).on('end', function() {
  handleRating(array, ind+1, contestId);
 });
};

module.exports = router;
