// PACKAGES SET UP
var express = require('express');
var app     = express();
var bodyParser = require('body-parser');
var mongoose = require('./db');
var user = require('./models/users');

// CONFIGURE APP TO USE bodyparser
app.use(bodyParser.urlencoded( {extended: true }));
app.use(bodyParser.json());

// SET PORT
var port = process.env.PORT || 8080;

// ROUTES
var router = express.Router();
router.get('/', function(req, res) {
    res.json({ message: 'hooray! welcome to our api!' });
});

// REGISTERING ROUTES
app.use('/api', router);

// STARTING THE SERVER
app.listen(port);
console.log('Magic happens on port ' + port);
