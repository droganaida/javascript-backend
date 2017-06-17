
var log = require('../../libs/log')(module);
var Categories = require('../../models/categories').Category;
var Articles = require('../../models/articles').Article;

exports.get = function(req, res){

    if (req.session.user) {

        res.locals.page = 'categories';
        res.locals.title = 'Категории блог';

        var indexArray = [];

        function getArticlesCount(category, callback){

            Articles.count({categories: (category._id).toString()}, function (err, count) {
                var articleCount = 0;
                if (count){
                    articleCount = count;
                }
                category.articlecount = articleCount;
                var pos = indexArray.indexOf(category.id);
                callback(category, pos);
            });
        }

        Categories.find({lang: "default"}).sort({position: 1}).exec(function(err, categories){

            if (categories && (categories.length > 0)){

                var catArray = [];
                var counter = 0;

                for (var i=0; i<categories.length; i++){

                    indexArray.push(categories[i].id);

                    getArticlesCount(categories[i], function(category, pos){

                        if (category){
                            catArray[pos] = category;
                        }
                        counter ++;
                        if (counter == categories.length){
                            res.locals.categories = catArray;
                            res.render('./admin/categories/categories');
                        }
                    });
                }
            } else {

                res.locals.categories = [];
                res.render('./admin/categories/categories');
            }
        });

    } else {
        res.render('./admin/login/login');
    }

};
