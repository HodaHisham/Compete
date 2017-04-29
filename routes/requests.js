var http = require('http');
var num  = 1;
module.exports.getContests = function(gym, cb){
  setInterval(function(){
    // Assign the HTTP request host/path
    var options = {
    	host: "codeforces.com",
    	path: "/api/contest.list?gym=" + gym
    };

    // Call the HTTP GET request
    http.get(options, function(res){
      res.setEncoding('utf8');
      var data = '';
    	res.on('data', function(contests){
        data += contests;
    	});
    	res.on('end', function(){
        cb(data);
        console.log(num++);
      });
    }).on('error', function(e){
      cb(e);
    }).setTimeout(2000, function(){

    	this.abort();
    });
  }, 60000);
};
