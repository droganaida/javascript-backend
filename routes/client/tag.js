
var Articles = require('../../models/articles').Article;
var MyConfig = require('../../libs/myconfig');
var log = require('../../libs/log')(module);

exports.get = function(req, res){

    res.locals.pagenoindex = 'yes';
    res.locals.tag = req.params.tag;
    res.locals.notfound = false;
    res.locals.showMore = false;
    res.locals.page = 'tags';

    var params = {};
    params.tags = req.params.tag;
    params.published = true;

    findArticles(params, function(articles, isMore, last, notFound){

        res.locals.articles = articles;

        if (isMore){
            res.locals.showMore = true;
            res.locals.from = last;
        }

        if (notFound){
            res.locals.notfound = true;
        }

        res.render('./client/tag/tag');
    });

};

function findArticles(params, callback){

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

                var counter = 0;
                var indexArray = [];

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

                    for (var i=0; i<articles.length; i++){

                        indexArray.push(articles[i]._id.toString());

                        checkParent(articles[i], function(rArticle){

                            counter++;
                            var pos = indexArray.indexOf(rArticle._id.toString());
                            articleArray[pos] = rArticle;

                            if (counter == articles.length){

                                callback(articleArray, isMore, last, notFound);
                            }
                        })
                    }
                }

            } else {
                notFound = true;
                callback(articleArray, isMore, last, notFound);
            }
        });

    function checkParent(article, callback){

        if (article.lang == 'default'){
            callback(article);
        } else {
            Articles.findOne({_id: article.parent}, function(err, parent){
                if (parent){
                    article.image = parent.image;
                    article.alias = parent.alias + "?language=" + article.lang;
                }
                callback(article);
            });
        }
    }
}

exports.post = function(req, res){

    if (req.body.action == 'more'){

        var params = {};
        params.tags = req.body.tag;

        var date = new Date(req.body.last);
        params.moderated = {$lt: date};
        params.published = true;

        findArticles(params, function(articles, isMore, last){
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