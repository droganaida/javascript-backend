
var log = require('../../libs/log')(module);
var MyConfig = require('../../libs/myconfig');
var Articles = require('../../models/articles').Article;


exports.get = function(req, res){


    Articles.findOne({alias: req.params.alias}, function(err, article){

        if (article){

            if (res.locals.language == 'default'){

                parseArticle(article, article.categories[0]);

            } else {

                findLocal(article, res.locals.language, true, function(resArticle){

                    if (resArticle){

                        parseArticle(resArticle, article.categories[0]);

                    } else {
                        parseArticle(article, article.categories[0]);
                    }
                })
            }

        } else {
            res.status = 404;
            res.locals.pagenoindex = 'yes';
            res.locals.metatitle = '404 Ничего не найдено';
            res.render('./client/error/error');
        }
    });

    function parseArticle(article, relCategory){

        Articles.addView(article._id, function(){

            res.locals.article = article;
            res.locals.metatitle = article.htmltitle;
            res.locals.metadescription = article.htmldescription;
            res.locals.metakeywords = article.htmlkeywords;

            Articles.find({_id: {$ne: article._id}, lang: 'default', categories: relCategory})
                .sort({moderated: -1})
                .limit(MyConfig.limits.relArticles)
                .exec(function(err, relarticles){

                    if (res.locals.language == 'default'){

                        res.locals.relarticles = relarticles;
                        res.render('./client/article/article');

                    } else {

                        localizeArticles(relarticles, res.locals.language, article, true, function(relArray){
                            res.locals.relarticles = relArray;
                            res.render('./client/article/article');
                        });
                    }
            });
        });
    }
};

function localizeArticles(articles, language, mainArticle, needTranslation, callback){

    var relArray = [];
    var counter = 0;

    for (var i=0; i<articles.length; i++){

        findLocal(articles[i], language, needTranslation, function(localArticle){

            counter ++;

            if (localArticle && (!mainArticle ||
                (localArticle._id.toString() != mainArticle._id.toString()))){
                relArray.push(localArticle);
            }
            if (counter == articles.length){

                callback(relArray);
            }
        })
    }
}

function findLocal(article, language, needTranslation, callback){

    if (article.lang == 'default' && (language == 'default')) {

        callback(article);
    } else {

        var params = {};
        if (needTranslation){
            params.parent = article._id;
            params.lang = language;
        } else {
            params._id = article.parent;
        }

        Articles.findOne(params, function(err, rArticle){

            if (rArticle){

                if (needTranslation) {
                    var tArticle = rArticle.toObject();
                    tArticle.alias = article.alias + "?language=" + rArticle.lang;
                    tArticle.image = article.image;
                    callback(tArticle);
                } else {
                    article.image = rArticle.image;
                    article.alias = rArticle.alias + "?language=" + article.lang;
                    callback(article);
                }
            } else {
                callback(null);
            }
        });
    }
}

exports.localize = function(articles, language, mainArticle, callback){

    localizeArticles(articles, language, mainArticle, true, function(localizedArticles){
        callback(localizedArticles);
    })
};

exports.findArticles = function(params, lang, mainArticle, needTranslation, callback){

    Articles
        .find(params)
        .sort({moderated: -1})
        .limit(MyConfig.limits.pageArticles)
        .exec(function(err, articles){

            var isMore = false;
            var last = 'none';
            var notFound = false;
            var articleArray = [];

            if (articles && (articles.length > 0)){

                if (articles.length == MyConfig.limits.pageArticles){

                    var lastDate = articles[articles.length - 1].moderated;
                    params.moderated = {$lt: lastDate};
                    Articles.findOne(params, function(err, nextArticle){

                        if (nextArticle){
                            isMore = true;
                            last = lastDate;
                        } else {
                            isMore = false;
                        }
                        getResLocals();
                    })
                } else {
                    getResLocals();
                }

                function getResLocals(){

                    localizeArticles(articles, lang, mainArticle, needTranslation, function(localizedArticles){
                        callback(localizedArticles, isMore, last, notFound);
                    });
                }

            } else {
                notFound = true;
                callback(articleArray, isMore, last, notFound);
            }
        });
};
