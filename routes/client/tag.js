
var log = require('../../libs/log')(module);
var Localizer = require('./article');

exports.get = function(req, res){

    res.locals.pagenoindex = 'yes';
    res.locals.tag = req.params.tag;
    res.locals.notfound = false;
    res.locals.showMore = false;
    res.locals.page = 'tags';

    var params = {};
    params.tags = req.params.tag;
    params.published = true;

    Localizer.findArticles(params, 'default', null, false, function(articles, isMore, last, notFound){

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

exports.post = function(req, res){

    if (req.body.action == 'more'){

        var params = {};
        params.tags = req.body.tag;

        var date = new Date(req.body.last);
        params.moderated = {$lt: date};
        params.published = true;

        Localizer.findArticles(params, 'default', null, false, function(articles, isMore, last, notFound){

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
