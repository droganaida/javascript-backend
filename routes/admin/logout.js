
var log = require('../../libs/log')(module);

exports.get = function(req, res, next){

    req.session.destroy(function(err) {
        if (err) return next(err);
        res.redirect('/admin');
    });

};