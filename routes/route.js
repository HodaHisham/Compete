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
        user.fb_id = req.body.id;
        user.cf_handle = req.body.handle;

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
  User.find({ id : req.params.user_id } , function(err, user) {
            if (err)
                res.send(err);
            else
                res.json(user);
  });
});

router.delete('/user/:user_id', function(req, res) {
  User.remove({ id : req.params.user_id } , function(err, user) {
            if (err)
                res.send(err);
            else
                res.json(user);
  });
});

router.put('/user/:user_id', function(req, res) {
  User.find({ id : req.params.user_id } , function(err, user) {
            if (err)
                res.send(err);
            else
            {
              user.id = req.body.id;
              user.handle = req.body.handle;

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
