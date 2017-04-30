// PACKAGES SET UP
var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var db = require('./db');
var router = require('./routes/route');
var app     = express();
var bot = require('./app');

// CONFIGURE APP TO USE bodyparser
app.use(bodyParser.urlencoded( {extended: true }));
app.use(bodyParser.json());

// CONNECT DATABASE
mongoose.connect( process.env.MONGODB_URI || db.url);
//db connection test
mongoose.connection.on('connected',()=>{
	console.log('Mongo works');
})

//db connection test
mongoose.connection.on('error',(err)=>{
	console.log('Mongo doesnt work  ' + err);
})



// SET PORT
var port = process.env.PORT || 5000;

// REGISTERING ROUTES
app.use('/api', router);
app.use('/webhook',bot);

// STARTING THE SERVER
app.listen(port);
console.log('Magic happens on port ' + port);
