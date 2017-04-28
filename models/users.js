var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var UserSchema   = new Schema({
    id : {
      type: String,
      required : true
    },
    name: String,
    handle: String,
    div1: Boolean,
    div2: Boolean,
    other: Boolean,
    gym: Boolean,
    eng: Boolean,
    russ: Boolean,
    rated: Boolean,
    unrated:Boolean
});

module.exports = mongoose.model('User', UserSchema);
