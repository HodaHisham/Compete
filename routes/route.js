var express = require('express');
var User    = require('../models/users');
var router  = express.Router();

// router.get('/', function(req, res){
//   res.json({ message: 'hooray! welcome to our api!' });
// });

router.get('/', function(req, res) {
      res.sendfile('./views/index.html');
});

router.post('/user', function(req, res) {

        var user = new User();
        user.fb_id = req.body.fb_id;
        user.cf_handle = req.body.cf_handle;

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
  User.find({ fb_id : req.params.user_id } , function(err, user) {
            if (err)
                res.send(err);
            else
                res.json(user);
  });
});

router.delete('/user/:user_id', function(req, res) {
  User.remove({ fb_id : req.params.user_id } , function(err, user) {
            if (err)
                res.send(err);
            else
                res.json(user);
  });
});

router.put('/user/:user_id', function(req, res) {
  User.find({ fb_id : req.params.user_id } , function(err, user) {
            if (err)
                res.send(err);
            else
            {
              user.fb_id = req.body.fb_id;
              user.cf_handle = req.body.cf_handle;
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
