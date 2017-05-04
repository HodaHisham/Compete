// PACKAGES SET UP
var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var db = require('./db');
var router = require('./routes/route');
var app = express();
var bot = require('./app');

// SETTING THE SERVER TO get contests' list from codeforces
bot.getContests(true); // gym
bot.getContests(false); // other
// router.getContests(false);

// CONFIGURE APP TO USE bodyparser
app.use(bodyParser.urlencoded( {extended: true}));
app.use(bodyParser.json());

// CONNECT DATABASE
mongoose.connect( process.env.MONGODB_URI || db.url);

// SET PORT
var port = process.env.PORT || 5000;

// REGISTERING ROUTES
app.use('/api', router.router);
app.use('/webhook', bot.router);

// STARTING THE SERVER
app.listen(port);
console.log('Magic happens on port ' + port);
