
var log = require('./libs/log')(module);
var Admins = require('./models/admins').Admin;
var Categories = require('./models/categories').Category;
var Myconfig = require('./libs/myconfig');
var async = require('async');

exports.commonMiddleware = function (req, res, next){

    //====================================================================================//
    //******************* Языковые переменные ********************//
    //====================================================================================//

    var language = "default";
    var langArray = [];

    for (var l = 0; l < Myconfig.languages.length; l++){
        if (!Myconfig.languages[l].default){
            langArray.push(Myconfig.languages[l].name)
        }
    }

    if (req.query && (req.query.language) && (langArray.indexOf(req.query.language) != -1)){
        language = req.query.language;
    }

    //====================================================================================//
    //******************* Параллельный запуск функций ********************//
    //====================================================================================//

    async.parallel([
        getEnvironment,
        getUserRights,
        getCurrentDate,
        getCategories
    ], function(err){
        if (err){
            log.error('------ Error ------ ' + err);
            next();
        } else {
            next();
        }
    });

    //====================================================================================//
    //******************* Переменные res.locals ********************//
    //====================================================================================//
    function getEnvironment(callback){

        var originalPageUrl = req.originalUrl;

        if (originalPageUrl.indexOf('?') != -1){
            originalPageUrl = originalPageUrl.substr(0, originalPageUrl.indexOf('?'));
        }
        res.locals.pageurl = req.protocol + '://' + req.get('host') + originalPageUrl;
        res.locals.currenthost = req.headers.host;
        res.locals.companyname = Myconfig.companyname;
        res.locals.pagenoindex = 'no';

        res.locals.language = language;
        res.locals.urltail = '';
        if (language != 'default'){
            res.locals.urltail = '?language=' + language;
        }
        res.locals.languages = Myconfig.languages;
        res.locals.locals = Myconfig.locals;

        res.locals.metatitle = '';
        res.locals.metadescription = '';
        res.locals.metakeywords = '';
        res.locals.socialimage = Myconfig.images.socialimage;
        res.locals.noimage = Myconfig.images.noimage;

        res.locals.page = '';
        res.locals.tags = [];
        res.locals.pagination = null;

        res.locals.env = process.env.NODE_ENV;

        callback();
    }

    //====================================================================================//
    //******************* Проверка прав администратора ********************//
    //====================================================================================//
    function getUserRights(callback){

        if (req.session.user){

            Admins.findOne({_id: req.session.user}, function(err, user){

                if (user){

                    res.locals.adminrights = user.rights;
                    res.locals.adminname = user.username;

                } else {

                    res.locals.adminrights = '';
                    res.locals.adminname = '';
                }

                callback();
            })

        } else {

            res.locals.adminrights = '';
            res.locals.adminname = '';
            callback();
        }
    }


    //====================================================================================//
    //******************* Переменные для текущего месяца и года ********************//
    //====================================================================================//
    function getCurrentDate(callback){

        var date = new Date();
        var month = date.getMonth();
        month = Myconfig.locals.month[language][month];

        res.locals.currentdate = month;
        res.locals.fullyear = date.getFullYear();
        callback();
    }

    //====================================================================================//
    //******************* Сбор категорий для основного меню блога ********************//
    //====================================================================================//
    function getCategories(callback) {

        Categories.find({ismain: false, lang: language}).sort({position: 1}).exec(function(err, categories){
            res.locals.categories = categories;
            res.locals.category = null;
            callback();
        })
    }

};

