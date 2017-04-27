var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var UserSchema   = new Schema({
    id: String,
    handle: String
});

module.exports = mongoose.model('User', UserSchema);
