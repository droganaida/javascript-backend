
var log = require('../../libs/log')(module);
var MyConfig = require('../../libs/myconfig');
var Articles = require('../../models/articles').Article;


exports.get = function(req, res){


    Articles.findOne({alias: req.params.alias}, function(err, article){

        if (article){

            if (res.locals.language == 'default'){

                parseArticle(article, article.categories[0]);

            } else {

                findLocal(article, res.locals.language, function(resArticle){

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

                        localizeArticles(relarticles, res.locals.language, article, function(relArray){
                            res.locals.relarticles = relArray;
                            res.render('./client/article/article');
                        });
                    }
            });

        });
    }

};

function localizeArticles(articles, language, mainArticle, callback){

    var relArray = [];
    var counter = 0;

    for (var i=0; i<articles.length; i++){

        findLocal(articles[i], language, function(localArticle){

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

function findLocal(article, language, callback){

    Articles.findOne({parent: article._id, lang: language}, function(err, rArticle){
        if (rArticle){
            var tArticle = rArticle.toObject();
            tArticle.parent = article;
            callback(tArticle);
        } else {
            callback(null);
        }
    });
}

exports.localize = function(articles, language, mainArticle, callback){

    localizeArticles(articles, language, mainArticle, function(localizedArticles){
        callback(localizedArticles);
    })
};