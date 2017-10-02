
var log = require('../../libs/log')(module);
var async = require('async');
var Categories = require('../../models/categories').Category;
var Localizer = require('./article');

exports.get = function(req, res){

    var language = res.locals.language;
    var isMain = false;

    var categorySearchParams = {};
    var articleSearchParams = {};

    if (req.params.alias){
        categorySearchParams.alias = req.params.alias;
    } else {
        categorySearchParams.ismain = true;
        isMain = true;
    }

    articleSearchParams.published = true;
    articleSearchParams.lang = 'default';
    if (language != 'default'){
        articleSearchParams.locales = language;
    }

    res.locals.showMore = false;
    res.locals.page = 'category';

    async.parallel([
        getCategory,
        getArticles
    ], function(err){
        if (err){
            log.info('------ Ошибка: ' + err);
            res.status = 404;
            res.locals.pagenoindex = 'yes';
            res.locals.metatitle = '404 Ничего не найдено';
            res.render('./client/error/error');
        } else {
            res.render('./client/category/category');
        }
    });

    function getCategory(callback){

        Categories.findOne(categorySearchParams, function(err, category){

            if (category && ((category.ismain && isMain) || (!category.ismain && !isMain))){

                if (language == "default"){

                    setLocalCategory(category, category, function(){
                        callback(null);
                    });

                } else {

                    Categories.findOne({parent: category._id, lang: language}, function(err, localCategory){

                        if (localCategory){

                            setLocalCategory(localCategory, category, function(){
                                callback(null);
                            });

                        } else {

                            setLocalCategory(category, category, function(){
                                callback(null);
                            });
                        }
                    })
                }

            } else {

                callback("Нет такой категории");
            }
        })
    }

    function setLocalCategory(category, parent, callback){

        res.locals.category = category;
        res.locals.metatitle = category.htmltitle;
        res.locals.metadescription = category.htmldescription;
        res.locals.metakeywords = category.htmlkeywords;

        if (!isMain){

            articleSearchParams.categories = parent._id.toString();

            Localizer.findArticles(articleSearchParams, res.locals.language, null, true, function(articles, isMore, last, notFound){

                if (isMore){
                    res.locals.showMore = true;
                    res.locals.from = last;
                }
                res.locals.articles = articles;
                callback();
            });
        } else {
            callback();
        }
    }

    function getArticles(callback){

        if (isMain){
            Localizer.findArticles(articleSearchParams, res.locals.language, null, true, function(articles, isMore, last, notFound){

                if (isMore){
                    res.locals.showMore = true;
                    res.locals.from = last;
                }
                res.locals.articles = articles;
                callback(null);
            });
        } else {
            callback(null);
        }
    }

};

exports.post = function(req, res){

    if (req.body.action == 'more'){

        var params = {};
        if (req.body.ismain != 'true'){
            params.categories = req.body.category;
        }
        if (req.body.language != 'default'){
            params.locales = req.body.language;
        } else {
            params.lang = 'default';
        }
        var date = new Date(req.body.last);
        params.moderated = {$lt: date};
        params.published = true;

        Localizer.findArticles(params, req.body.language, null, true, function(articles, isMore, last, notFound){

            res.render('./client/modules/articleItemArray', {articles: articles}, function(err, html){
                var data = {};
                if (isMore){
                    data.last = last;
                }
                if (html){
                    data.html = html;
                } else {
                    data.html = '';
                }
                res.send(data);
            });
        });
    }
};
