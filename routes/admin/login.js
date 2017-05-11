
var log = require('../../libs/log')(module);
var Admin = require('../../models/admins').Admin;
var Config = require('../../libs/myconfig');

exports.post = function(req, res) {

    var username = req.body.username;
    var password = req.body.password;

    function checkAdmin(){

        Admin.find({}, function(err, admins){

            if (admins && (admins.length > 0)){

                Admin.authorize(username, password, function(err, admin){

                    if (err){
                        if (err === 403){
                            res.send(Config.messages.error.auth);
                        }else{
                            log.error(err);
                            res.send(Config.messages.error.db);
                        }
                    } else {

                        req.session.user = admin._id;
                        var link = "/admin/categories";
                        res.send({link: link});
                    }
                });

            } else {

                Admin.createAdmin(username, password, "superadmin", function(){
                    checkAdmin();
                });
            }
        })
    }

    checkAdmin();

};