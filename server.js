// PACKAGES SET UP
var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var db = require('./db');
var router = require('./routes/route');
var app     = express();

// CONFIGURE APP TO USE bodyparser
app.use(bodyParser.urlencoded( {extended: true }));
app.use(bodyParser.json());

// CONNECT DATABASE
mongoose.connect(db.url);

// SET PORT
var port = process.env.PORT || 8080;

// REGISTERING ROUTES
app.use('/api', router);

// STARTING THE SERVER
app.listen(port);
console.log('Magic happens on port ' + port);
