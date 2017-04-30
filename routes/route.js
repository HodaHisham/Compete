var express = require('express');
var User    = require('../models/users');
var router  = express.Router();
var http    = require('http');
var request = require('request');

router.get('/', function(req, res) {
  res.json({message: 'hooray! welcome to our api!'});
});

// just for testing
router.get('/cf/:handle/', function(req, res) {
      request({
                    url: 'http://codeforces.com/api/user.info?handles='+req.params.handle,
                    method: 'GET'
                  }, function(error, response, body) {
                    if (error) {
                      console.log('Error sending messages: ', error)
                    } else if (response.body.error) {
                      console.log('Error: ', response.body.error)
                    } else {
                      obj = JSON.parse(body);
                      if(obj.status==='FAILED') {
                      console.log('Handle does not exist. Please try again', error);
                      return;
                    } else {
                      console.log(obj.status, error);
                    }
                  }
              });
});

router.get('/', function(req, res) {
      res.sendfile('./views/index.html');
});

router.post('/user', function(req, res) {
        var user = new User();
        user.fbId = req.body.fbId;
        user.cfHandle = req.body.cfHandle;

        user.save(function(err) {
            if (err)
                console.log(err);
            else
                res.json({message: 'User created!'});
        });
});

router.get('/user', function(req, res) {
  User.find(function(err, users) {
      if (err)
          res.send(err);
      else
          res.json(users);
  });
});

router.get('/user/:user_id', function(req, res) {
  User.find({fbId: req.params.user_id}, function(err, user) {
            if (err)
                res.send(err);
            else
                res.json(user);
  });
});

router.delete('/user/:user_id', function(req, res) {
  User.remove({fbId: req.params.user_id}, function(err, user) {
            if (err)
                res.send(err);
            else
                res.json(user);
  });
});

router.put('/user/:user_id', function(req, res) {
  User.findOne({fbId: req.params.user_id}, function(err, user) {
            if (err)
                res.send(err);
            else {
              user.fbId = req.params.user_id;
              user.cfHandle = req.body.cfHandle;
              user.name = req.body.name;
              user.div1 = req.body.div1;
              user.div2 = req.body.div2;
              user.other = req.body.other;
              user.gym = req.body.gym;
              user.eng = req.body.eng;
              user.russ = req.body.russ;
              user.rated = req.body.rated;
              user.unrated = req.body.unrated;

              user.save(function(err) {
                  if (err)
                      console.log(err);
                  else
                      res.json({message: 'User updated!'});
              });
            }
  });
});
router.get('/contests/:gym', function(req, res) {
  setInterval(function() {
    // Assign the HTTP request host/path
      request({
         url: 'http://codeforces.com/api/contest.list?gym='+req.params.gym,
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
                 var item = JSON.parse(array[i]);
                 console.log(item);
                 Contest.findOne({conId: item.id}, function(err, con) {
                  if(err) {
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
                  User.find().forEach(function(err, user) {
                    if(user.gym && con.gym)
                      console.log(user.fbId, 'A new gym contest is announced! ' + item.name + ' will take place after '
                     + (item.relativeTimeSeconds / 86400) + ' day(s) ' + ((item.relativeTimeSeconds % 86400) / 3600) + ' hour(s) ' +
                     (((item.relativeTimeSeconds % 86400) % 3600) / 60) + ' min(s) '
                     );
                   else if(user.div1 && con.div1)
                     console.log(user.fbId, 'A new div1 contest is announced! ' + item.name + ' will take place after '
                    + (item.relativeTimeSeconds / 86400) + ' day(s) ' + ((item.relativeTimeSeconds % 86400) / 3600) + ' hour(s) ' +
                    (((item.relativeTimeSeconds % 86400) % 3600) / 60) + ' min(s) '
                    );
                   else if(user.div2 && con.div2)
                     console.log(user.fbId, 'A new div2 contest is announced! ' + item.name + ' will take place after '
                    + (item.relativeTimeSeconds / 86400) + ' day(s) ' + ((item.relativeTimeSeconds % 86400) / 3600) + ' hour(s) ' +
                    (((item.relativeTimeSeconds % 86400) % 3600) / 60) + ' min(s) '
                    );
                   if(!con.rem24H && item.relativeTimeSeconds >= -86400000) {
                      con.rem24H = true;
                       console.log(user.fbId, 'Reminder: ' + item.name + ' will take place in 24 hours');
                    }
                   if(!con.rem1H && item.relativeTimeSeconds >= -3600000) {
                      con.rem1H = true;
                       console.log(user.fbId, 'Reminder: ' + item.name + ' will take place in 1 hour');
                    }
                   if(!con.sysTestSt && item.phase === 'SYSTEM_TEST') {
                      con.sysTestSt = true;
                       console.log(user.fbId, 'System Testing for ' + con.name + ' has started!');
                    }
                    if(!con.sysTestEnd && item.phase === 'FINISHED') {
                       con.sysTestEnd = true;
                       monitorRating(item.id, con);
                        console.log(user.fbId, 'System Testing for ' + con.name + ' has ended!');
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
});


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
                  var item = JSON.parse(array[i]);
                  User.findOne({cfHandle: item.handle}, function(err, user) {
                   if(!err) {
                     console.log(user.fbId, item.newRating > item.oldRating?
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
