
var crypto = require('crypto');
var log = require('../libs/log')(module);
var async = require('async');

var mongoose = require('../libs/mongoose'),
    Schema = mongoose.Schema;

var schema = new Schema({

    username: {
        type: String,
        unique: true,
        required: true
    },
    hashedPassword: {
        type: String,
        required: true
    },
    salt: {
        type: String,
        required: true
    },
    rights: {
        type: String,
        default: 'moderator'
    }
});

schema.virtual('password')

    .set(function(password){

        this.salt = Math.random() + 'salt';
        this.hashedPassword = this.encryptPassword(password);
    })

    .get(function(){

        return 'Top secret!'
    });


schema.methods = {

    encryptPassword: function (password) {

        return crypto.createHmac('sha256', this.salt).update(password).digest('hex');
    },
    checkPassword: function (password) {

        return this.encryptPassword(password) === this.hashedPassword;
    }
};

schema.statics = {

    authorize: function(username, password, callback){

        var Admin = this;

        async.waterfall([
            function(callback){
                if (username){
                    Admin.findOne({username: username}, callback);
                }
            },
            function(admin, callback){
                if (admin){
                    if (admin.checkPassword(password)){
                        callback(null, admin);
                    } else {
                        callback(403);
                    }
                } else {
                    callback(403);
                }
            }
        ], callback);
    },
    createAdmin: function(username, password, rights, callback){

        var Admin = this;

        var userFilter = /^([a-zA-Z0-9_\-])+$/;
        var passFilter = /^[a-zA-Z0-9,!,%,&,@,#,$,\^,*,?,_,~,+]*$/;

        async.waterfall([
            function(callback){
                if (!userFilter.test(username)) {
                    callback('userError');
                } else {
                    callback(null);
                }
            },
            function(callback){
                if ((!passFilter.test(password)) || (password.length < 4)) {
                    callback('passwordError');
                } else {
                    callback(null);
                }
            },
            function(callback){
                Admin.findOne({username:username}, function(err, user){
                    if (user) {
                        callback('doubleUser');
                    } else {
                        callback(null);
                    }
                });
            }
        ],
        function(err){

            if (err){
                log.error("------ DB ERROR ----- " + err);
                callback(err);
            } else {

                var admin = new Admin({
                    username: username,
                    password: password,
                    rights:rights
                });

                admin.save(function(err){
                    if (err) return callback(err);
                    callback (null, admin);
                });
            }
        });
    }
};

exports.Admin = mongoose.model('Admin', schema);
