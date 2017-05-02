var express = require('express');
var User = require('../models/users');
var router = express.Router();
var request = require('request');
var Contest = require('../models/contests');

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
                      console.log('Error sending messages: ', error);
                    } else if (response.body.error) {
                      console.log('Error: ', response.body.error);
                    } else {
                      var obj = JSON.parse(body);
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
        user.div1 = req.body.div1;
        user.div2 = req.body.div2;
        user.gym = req.body.gym;
        console.log(req.body);
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
router.get('/contest', function(req, res) {
  Contest.find(function(err, contests) {
      if (err)
          res.send(err);
      else
          res.json(contests);
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
        user.gym = req.body.gym;
        user.save(function(err) {
            if (err)
                console.log(err);
            else
                res.json({message: 'User updated!'});
        });
      }
  });
});
router.put('/contest/:contest_id', function(req, res) {
  Contest.findOne({conId: req.params.contest_id}, function(err, con) {
      if (err)
          res.send(err);
      else {
        con.conId = req.params.contest_id;
        con.div1 = req.body.div1;
        con.div2 = req.body.div2;
        con.gym = req.body.gym;
        con.rem24H = req.body.rem24H;
        con.rem1H = req.body.rem1H;
        con.sysTestSt = req.body.sysTestSt;
        con.sysTestEnd = req.body.sysTestEnd;
        con.ratingCh = req.body.ratingCh;

        con.save(function(err) {
            if (err)
                console.log(err);
            else
                res.json({message: 'Contest updated!'});
        });
      }
  });
});
router.get('/contests/:gym', function(req, res) {
  setInterval(function() {
    // Assign the HTTP request host/path
    var gym = req.params.gym;
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
             var obj = JSON.parse(body);
             if(obj.status === 'OK') {
               Contest.count({}, function( err, count) {
                 processContest(obj.result, 0, gym, count !== 0);
               });
             }
       }
    });
  }, 60000*3);
});

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
     var rem24 = false, rem1 = false, systS = false, systE = false;
     var remainingTime = Math.floor(-item.relativeTimeSeconds / 86400) + ' day(s) ' + Math.floor((-item.relativeTimeSeconds % 86400) / 3600) + ' hour(s) ' +
     Math.floor(((-item.relativeTimeSeconds % 86400) % 3600) / 60) + ' min(s) ';
    //  console.log(remainingTime);
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
         console.log(gym);
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
            console.log(user.fbId, 'A new gym contest is announced! ' + item.name + ' will take place after ' + remainingTime);
          } else if(user.div1 && con.div1) {
             interested = true;
             console.log(user.fbId, 'A new div1 contest is announced! ' + item.name + ' will take place after ' + remainingTime);
          } else if(user.div2 && con.div2) {
             interested = true;
             console.log(user.fbId, 'A new div2 contest is announced! ' + item.name + ' will take place after ' + remainingTime);
          }
        }
          console.log('interested ' + interested);
          if(interested) {
            if(rem24)
              console.log(user.fbId, 'Reminder: ' + item.name + ' will take place in 24 hours');
            if(rem1)
              console.log(user.fbId, 'Reminder: ' + item.name + ' will take place in 1 hour');
            if(systS)
              console.log(user.fbId, 'System Testing for ' + item.name + ' has started!');
            if(systE)
              console.log(user.fbId, 'System Testing for ' + item.name + ' has ended!');
          }
          // console.log(con);
         }).on('end', function() {
           processContest(array, ind+1, gym, ann);
         });
     });
     });
 };
var interv = setInterval(function() {
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
          console.log('body ' + body);
          var obj = JSON.parse(body);
          if(obj.status === 'FAILED') {
            console.log('Rating changes are not available', error);
          } else {
              var array = obj.result;
              console.log('array ' + array);
              handleRating(array, 0, id);
          }
      }
  });
}, 60000*3);

function monitorRating(id) {
  interv();
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
  console.log('item' + item);
  User.find({}).cursor().on('data', function(user) {
   if(!user) {
     console.log(user.fbId, item.newRating > item.oldRating?
      'Congrats! You earned ' + (item.newRating - item.oldRating)
      + ' rating points in ' + item.contestName:'You lost '+ (item.oldRating - item.newRating)
      + ' rating points in ' + item.contestName + '. I know you can do it next time! Keep up the hard work :D');
   }
  }).on('end', function() {
   handleRating(array, ind+1, contestId);
  });
 };

module.exports = router;
