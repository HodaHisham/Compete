var express = require('express');
var User    = require('../models/users');
var router  = express.Router();
var http    = require('http');
var request = require('request');

router.get('/', function(req, res){
  res.json({ message: 'hooray! welcome to our api!' });
});


router.get('/cf/:handle/', function(req, res) {
      
      request({
                    url: 'http://codeforces.com/api/user.info?handles='+req.params.handle,
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
                    else if(response.status==='FAILED'){
                      console.log('Handle does not exist. Please try again',error);
                      return;
                    }
                    else {
                      res.json(body);
                      console.log(response.status,error);

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
                res.json({ message: 'User created!' });
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
  User.find({ fbId : req.params.user_id } , function(err, user) {
            if (err)
                res.send(err);
            else
                res.json(user);
  });
});

router.delete('/user/:user_id', function(req, res) {
  User.remove({ fbId : req.params.user_id } , function(err, user) {
            if (err)
                res.send(err);
            else
                res.json(user);
  });
});

router.put('/user/:user_id', function(req, res) {

    
  User.findOne({ fbId : req.params.user_id } , function(err, user) {
            if (err)
                res.send(err);
            else
            {
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
                      res.json({ message: 'User updated!' });
              });
            }
  });
});

module.exports = router;
