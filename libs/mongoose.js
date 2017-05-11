var mongoose = require('mongoose');
var myconfig = require('./myconfig');

mongoose.set('debug', true);

mongoose.connect(myconfig.mongoose.uri), myconfig.mongoose.options;

module.exports = mongoose;