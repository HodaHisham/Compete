var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var ContSchema   = new Schema({
    conId : {
      type: Integer,
      required : true
    },
    div1:        Boolean,
    div2:        Boolean,
    gym:         Boolean,
    rem24H:      Boolean,
    rem1H:       Boolean,
    sysTestEnd:  Boolean,
    sysTestSt:   Boolean,
    ratingCh:    Boolean
});

module.exports = mongoose.model('Contest', ContSchema);
