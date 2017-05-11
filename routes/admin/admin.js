
var log = require('../../libs/log')(module);
var Admin = require('../../models/admins').Admin;

exports.get = function(req, res){

    res.locals.title = "Вход";
    res.locals.page = "login";

    if (req.session.user){

        Admin.findOne({_id:req.session.user}, function(err){
            if (err){
                res.render('./admin/login/login');
            } else {
                res.redirect('/admin/categories');
            }
        })
    } else {
        res.render('./admin/login/login');
    }

};