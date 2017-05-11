
var log = require('../../libs/log')(module);
var Articles = require('../../models/articles').Article;
var Categories = require('../../models/categories').Category;

exports.get = function(req, res){

    if (req.session.user) {

        res.locals.page = 'articles';

        Categories.findOne({_id: req.params.id}, function(err, category){

            if (category){

                res.locals.category = category;
                res.locals.title = "Статьи в категории " + category.title;

                Articles.find({categories: req.params.id}).sort({moderated: -1}).exec(function(err, articles){
                    if (articles &&(articles.length > 0)){
                        res.locals.articles = articles;
                    } else {
                        res.locals.articles = [];
                    }
                    res.render('./admin/articles/articles');
                });

            } else {

                res.locals.title = '404 Ничего не найдено';
                res.status(404).render('./client/error/error', {errorCode: 404, errorText: 'Страница не найдена'});
            }
        });


    } else {
        res.render('./admin/login/login');
    }
};

exports.post = function(req, res){

    if (req.body.action == 'searcharticle'){

        Articles.find({title: {$regex: req.body.key, $options: 'im'}}).limit(10).exec(function(err, articles){

            if (articles && (articles.length > 0)){

                var category = {};
                category._id = req.body.catid;

                res.render('./admin/articles/item', {articles:articles, category:category}, function(err, html){
                    if (err){
                        log.error('---------- Error: ' + err);
                        res.send({result: ''});
                    } else {
                        res.send({result: html});
                    }
                });

            } else {
                res.send({result : ''});
            }

        });
    }
};
