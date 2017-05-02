var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserSchema = new Schema({
    fbId: {
      type: String,
      required: true,
    },
    name: String,
    cfHandle: String,
    div1: Boolean,
    div2: Boolean,
    gym: Boolean
});

module.exports = mongoose.model('User', UserSchema);
