var http = require('http');

module.exports.getContests = function(gym, cb){
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
      });
    }).on('error', function(e){
      cb(e);
    }).setTimeout(2000, function(){

    	this.abort();
    });
};
