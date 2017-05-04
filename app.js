var express = require('express');
var User = require('./models/users');
var request = require('request');
var router = express.Router();
var Contest = require('./models/contests');

router.get('/', function(req, res) {
  if (req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === process.env.VERIFY_TOKEN) {
    console.log('Validating webhook');
    res.status(200).send(req.query['hub.challenge']);
  } else {
    console.error('Failed validation. Make sure the validation tokens match.');
    res.sendStatus(403);
  }
});


router.post('/', function(req, res) {
  console.log('entered post of webhook');
  var data = req.body;
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

/**
 * Handling postback from user
 * @param {Object} event
 */
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

/**
 * Handling message from user
 * @param {Object} event
 */
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
/**
 * Sends a user of the bot a message handling messages not handled yet by the bot.
 * @param {String} senderID The facebook page-scoped user ID I just received a message from.
 * @param {String} messageText The message the bot received.
 */
  function handleWrongMessage(senderID, messageText) {
    sendTextMessage(senderID, 'Sorry I don\'t understand :(\nTo update your handle, type handle: my_handle\nTo subscribe, write sub: div1 div2 gym\nTo unsubscribe, write unsub: div1 div2 gym\n');
  }

  /**
   * Handles the subscriptions of the users to certain contest categories and confirms with the user by sending a message back
   * @param {String} user The facebook page-scoped user ID I just received a message from.
   * @param {String} messageText The message the bot received.
   * @param {Boolean} sub whether the user wants to subscribe to the specified categories.
   */
  function handleSubscriptions(user, messageText, sub) {
    if(messageText.indexOf('div1') !== -1) {
      user.div1 = sub;
    }
    if(messageText.indexOf('div2') !== -1) {
        user.div2 = sub;
    }
    if(messageText.indexOf('gym') !== -1) {
        user.gym = sub;
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

  /**
   * Converts the messageText to JSON format to send afterwards using Send API provided by messanger
   * @param {String} recipientId The facebook page-scoped user ID I just received a message from.
   * @param {String} messageText The message the bot is sending.
   */
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
/**
 * Sends the actual message to the user
 * @param {Object} messageData The message the bot is sending in JSON format.
 */
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
};

module.exports.getContests = function(gym) {
  setInterval(function() {
    // Assign the HTTP request host/path
      request({
         url: 'http://codeforces.com/api/contest.list?gym='+gym,
        //  url: 'https://sheltered-reef-68226.herokuapp.com/'+gym,
         method: 'GET'
        }, function(error, response, body) {
           if (error) {
             console.log('Error sending messages: ', error);
           } else if (response.body.error) {
             console.log('Error: ', response.body.error);
           } else{
             obj = JSON.parse(body);
             if(obj.status === 'OK') {
              //  Contest.count({}, function( err, count) {
                 processContest(obj.result, 0, gym, true);
              //  });
             }
           }
         });
  }, 60000*2);
};

/**
 * Recursively iterate over array and handling if announcements should be sent to users
 * @param {String} array The result array from request sent to codeforces containing info about contests
 * @param {Number} ind the index of the current contest being processed in the array
 * @param {Boolean} gym whether the request sent was for gym contests
 * @param {Boolean} ann whether the bot should announce any contest
 */
function processContest(array, ind, gym, ann) {
  if(ind == array.length)
    return;
  var item = array[ind];
  if(!item)
    return;
    Contest.findOne({conId: item.id}, function(err, con) {
     var conAnn = true;
     if(err || !con) {
      con = new Contest();
      var categorySpecified = false;
      con.conId = item.id;
      if(item.name.indexOf('Div.1') !== -1 || item.name.indexOf('Div. 1') !== -1) {
        con.div1 = true;
        categorySpecified = true;
      } else con.div1 = false;
      if(item.name.indexOf('Div.2') !== -1 || item.name.indexOf('Div. 2') !== -1) {
        con.div2 = true;
        categorySpecified = true;
      } else con.div2 = false;
      if(gym) {
        con.gym = true;
        categorySpecified = true;
      } else con.gym = false;
      if(!categorySpecified) {
        con.div1 = true;
        con.div2 = true;
      }
      con.rem24H = typeof item.relativeTimeSeconds == 'undefined';
      con.rem1H = typeof item.relativeTimeSeconds == 'undefined';
      con.sysTestSt = false;
      con.sysTestEnd = false;
    } else conAnn = false;
     conAnn &= !(typeof item.relativeTimeSeconds == 'undefined' || item.relativeTimeSeconds > 0 || item.relativeTimeSeconds < -86400*7);
    //  console.log(con);
     var rem24 = false, rem1 = false, systS = false, systE = false;
     var remainingTime = typeof item.relativeTimeSeconds == 'undefined'?'':item.name + ' will take place after ' + (Math.floor(-item.relativeTimeSeconds / 86400) + ' day(s) ' + Math.floor((-item.relativeTimeSeconds % 86400) / 3600) + ' hour(s) ' +
     Math.floor(((-item.relativeTimeSeconds % 86400) % 3600) / 60) + ' min(s) ');
    //  console.log(remainingTime);
     if(!con.rem1H && item.relativeTimeSeconds >= -3600 && item.relativeTimeSeconds < 0) {
        rem1 = true;
        con.rem1H = true;
        // console.log('Reminder: ' + item.name + ' will take place in 1 hour');
      } else if(!con.rem1H && !con.rem24H && item.relativeTimeSeconds >= -86400 && item.relativeTimeSeconds < 0) {
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
        User.find({}).cursor().on('data', function(user) {
         if(!user)
           return;
         console.log('handle: ' + user.cfHandle + ' contest id: ' + con.conId);
         if(user.cfHandle === 'Hoda_Hisham' && con.conId == 782) // FOR TESTING
          monitorRating(con.conId);
         var interested = false;
         if(user.gym && con.gym) {
            interested = true;
            if(ann && conAnn) sendTextMessage(user.fbId, 'A new gym contest is announced! ' + remainingTime);
          } else if((user.div1 || user.div2) && con.div1 && con.div2) {
            interested = true;
            if(ann && conAnn) sendTextMessage(user.fbId, 'A new div1 && div2 contest is announced! ' + remainingTime);
          } else if(user.div1 && con.div1) {
             interested = true;
             if(ann && conAnn) sendTextMessage(user.fbId, 'A new div1 contest is announced! ' + remainingTime);
          } else if(user.div2 && con.div2) {
             interested = true;
             if(ann && conAnn) sendTextMessage(user.fbId, 'A new div2 contest is announced! ' + remainingTime);
          }
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
         }).on('end', function() {
           processContest(array, ind+1, gym, ann);
         });
      });
     });
 };
 var monitorRating = function(id) {
   setInterval(function() {
   console.log('entered rating');
   request({
         url: 'http://codeforces.com/api/contest.ratingChanges?contestId='+id,
        //  url: 'https://sheltered-reef-68226.herokuapp.com/rating',
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
 }, 60000);
};

/**
 * Recursively iterate over array and handling if announcements should be sent to users
 * @param {String} array The result array from request sent to codeforces containing info about rating changes
 * @param {Number} ind the index of the current rating change being processed in the array
 * @param {Number} contestId the contest getting its rating results
 */
function handleRating(array, ind, contestId) {
  if(ind == array.length || !array[ind]) {
    clearInterval(monitorRating);
    Contest.findOne({conId: contestId}, function(err, con) {
      con.save(function(err) {
            if (err)
                console.log(err);
            else
                console.log({message: 'Contest updated/created!'});
      });
    });
    return;
  }
  var item = array[ind];
  User.find({cfHandle: item.handle}).cursor().on('data', function(user) {
   if(user) {
     var newcol = calRatingColor(item.newRating);
     var oldcol = calRatingColor(item.oldRating);
     var ratingCol = newcol === oldcol?'. ':'. You became a(n) ' + newcol + '!';
     sendTextMessage(user.fbId, item.newRating > item.oldRating?
      'Congrats! You earned ' + (item.newRating - item.oldRating)
      + ' rating points in ' + item.contestName + ratingCol:'You lost '+ (item.oldRating - item.newRating)
      + ' rating points in ' + item.contestName + + ratingCol + 'I know you can do it next time! Keep up the hard work :D');
   }
 }).on('end', function() {
  handleRating(array, ind+1, contestId);
 });
};

/**
 * Calculates the title of the input rating
 * @param {Number} rating
 * @return {String} the corresponding title of the rating parameter
 */
function calRatingColor(rating) {
  if(rating >= 2900)
    return 'Legendary Grandmaster	';
  else if(rating >= 2600 && rating <= 2899)
    return 'International Grandmaster';
  else if(rating >= 2400 && rating <= 2599)
    return 'Grandmaster';
  else if(rating >= 2300 && rating <= 2399)
    return 'International Master';
  else if(rating >= 2200 && rating <= 2299)
    return 'Master';
  else if(rating >= 1900 && rating <= 2199)
    return 'Candidate Master';
  else if(rating >= 1600 && rating <= 1899)
    return 'Expert';
  else if(rating >= 1400 && rating <= 1599)
    return 'Specialist';
  else if(rating >= 1200 && rating <= 1399)
    return 'Pupil';
  else return 'Newbie';
}

module.exports.router = router;
