var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var UserSchema   = new Schema({
    id      : {
      type: String,
      required : true
    },
    handle  : String
});

module.exports = mongoose.model('User', UserSchema);
