
var session = require('express-session');
var mongoose = require('../libs/mongoose');
var mongoStore = require('connect-mongo')(session);

var sessionStore = new mongoStore({mongooseConnection: mongoose.connection});

module.exports = sessionStore;