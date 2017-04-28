// PACKAGES SET UP
var express = require('express');
var app     = express();
var bodyParser = require('body-parser');
var mongoose = require('./db');
var user = require('./models/users');
var router = require('./routes/route');

// CONFIGURE APP TO USE bodyparser
app.use(bodyParser.urlencoded( {extended: true }));
app.use(bodyParser.json());

// SET PORT
var port = process.env.PORT || 8080;

// REGISTERING ROUTES
app.use('/api', router);

// STARTING THE SERVER
app.listen(port);
console.log('Magic happens on port ' + port);
