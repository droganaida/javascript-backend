
var log = require('../../libs/log')(module);
var Articles =  require('../../models/articles').Article;
var Categories = require('../../models/categories').Category;
var Tags = require('../../models/tags').Tags;
var fileupload = require('../../libs/fileupload');
var Config = require('../../libs/myconfig');

exports.get = function(req, res){

    if (req.session.user && ((res.locals.adminrights == 'superadmin') || (res.locals.adminrights == 'blog'))) {

        res.locals.currentcat = req.params.id;
        res.locals.parent = 'me';
        res.locals.lang = 'default';
        res.locals.page = 'editarticle';
        res.locals.languages = Config.languages;

        Categories.find({ismain: false, lang: 'default'}, function(err, categories){
            if (categories && (categories.length > 0)){

                res.locals.categories = categories;

                if (req.params.label != 'new'){

                    Articles.findOne({_id: req.params.label}, function(err, article){
                        if (article){

                            res.locals.title = 'Редактор: ' + article.title;

                            if (req.params.lang){

                                Articles.findOne({parent: req.params.label, lang: req.params.lang}, function(err, lproduct){

                                    res.locals.lang = req.params.lang;
                                    res.locals.parent = req.params.label;

                                    if (lproduct){

                                        res.locals.article = lproduct;

                                    } else {

                                        res.locals.article = 'new'
                                    }

                                    res.render('./admin/editarticle/editarticle');
                                })

                            } else {

                                res.locals.article = article;
                                res.render('./admin/editarticle/editarticle');
                            }

                        } else {
                            res.locals.title = '404 Ничего не найдено';
                            res.status(404).render('./client/error/error', {errorCode: 404, errorText: 'Страница не найдена'});
                        }
                    })
                } else {
                    res.locals.article = 'new';
                    res.locals.title = 'Новая статья';
                    res.render('./admin/editarticle/editarticle');
                }
            } else {
                res.locals.title = '404 Ничего не найдено';
                res.status(404).render('./client/error/error', {errorCode: 404, errorText: 'Страница не найдена'});
            }
        });

    } else{
        res.render('./admin/login/login');
    }
};

exports.post = function(req, res){

    function checkTags(callback){

        if (req.body.tags && (req.body.tags.length > 0)){

            var counter = 0;
            for (var i=0; i<req.body.tags.length; i++){
                Tags.createTags(req.body.tags[i], function(){
                    counter ++;
                    if (counter == req.body.tags.length){
                        callback();
                    }
                })
            }

        } else {
            callback();
        }
    }

    if (req.body.action == 'newarticle'){

        Articles.findOne({alias: req.body.alias, lang: 'default'}, function(err, article){

            if (article){

                res.send("Статья с таким URL уже существует!");

            } else {

                if (req.body.lang == 'default'){

                    Articles.createArticle(req.body.title, req.body.shortdescription, req.body.description, req.body.htmltitle, req.body.htmldescription,
                        req.body.htmlkeywords, req.body.alias, req.body.categories, req.body.tags, req.body.moderator, function(err, product){
                            if (err){
                                res.send(err);
                            } else {

                                checkTags(function(){
                                    res.send({id : product._id});
                                });
                            }
                        });

                } else {

                    Articles.createLocal(req.body.parent, req.body.lang, req.body.title, req.body.shortdescription, req.body.description, req.body.htmltitle, req.body.htmldescription,
                        req.body.htmlkeywords, req.body.tags, req.body.moderator, function(err, product){
                            if (err){
                                res.send(err);
                            } else {

                                checkTags(function(){
                                    res.send({id : product._id});
                                });
                            }
                        });
                }
            }
        });

    } else if (req.body.action == 'editarticle'){

        Articles.findOne({alias: req.body.alias, lang: 'default'}, function(err, article){

            if (article && (article._id != req.body.id)){

                res.send("Статья с таким URL уже существует!");

            } else {

                Articles.editArticle(req.body.lang, req.body.id, req.body.title, req.body.shortdescription, req.body.description, req.body.htmltitle, req.body.htmldescription,
                    req.body.htmlkeywords, req.body.alias, req.body.categories, req.body.tags, req.body.moderator, function(err, article){

                    if (err){
                        res.send(err);
                    } else {

                        checkTags(function(){
                            res.send({id : req.body.id});
                        });
                    }
                });
            }
        });

    } else if (req.body.action == 'savemainimage'){

        if (req.files.length && (req.files.length > 0)){

            var dir = 'blog/' + req.body.id;

            // Можно сделать saveFile, если компрессия не нужна
            fileupload.saveWithResizeFile(dir, req.files[0], 'mainimage', 860, function(err, filelink){
            // fileupload.saveFile(dir, req.files[0], 'mainimage', function(err, filelink){
                if (err){
                    res.send(err);
                } else {

                    Articles.saveMainImage(req.body.id, filelink, function(err){

                        if (err){
                            res.send(err);
                        } else {
                            fileupload.slideCrop('..' + filelink, 385, 205, function(err){
                                if (err){
                                    res.send('Невозможно создать превью!');
                                } else {

                                    fileupload.sqCrop('..' + filelink, 300, function(err){
                                        if (err){
                                            res.send('Невозможно создать превью!');
                                        } else {
                                            res.send('Success');
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
        } else {
            res.send('Не выбран файл для загрузки!');
        }

    } else if (req.body.action == 'deletemainimg'){

        var filename = req.body.file;
        var ext = filename.substr(filename.lastIndexOf('.'));
        filename = filename.substr(0, filename.lastIndexOf('.'));
        var minfile = filename + '-min' + ext;
        var slidefile = filename + '-slide' + ext;

        fileupload.fileUnlink(req.body.file, function(err){

            if (err){
                res.send('Невозможно удалить файл!');
            } else {

                fileupload.fileUnlink(minfile, function(err){
                    if (err){
                        res.send('Невозможно удалить файл!');
                    } else {

                        fileupload.fileUnlink(slidefile, function(err){
                            if (err){
                                res.send('Невозможно удалить файл!');
                            } else {

                                Articles.saveMainImage(req.body.id, '', function(err){
                                    if (err){
                                        res.send('Невозможно удалить файл!')
                                    } else {
                                        res.send({ok: "ok"});
                                    }

                                });
                            }
                        });
                    }
                });
            }
        })

    } else if (req.body.action == 'setpublished'){

        var flag = true;
        if (req.body.flag == 'no'){
            flag = false;
        }

        Articles.setPublished(req.body.id, flag, function(err){
            if (err){
                res.send(err);
            } else {
                res.send({ok: 'ok'});
            }
        })

    } else if (req.body.action == 'deletearticle') {

        function removeProduct(id, callback){

            Articles.deleteArticle(id, function(err){
                if (err){
                    callback(err);
                } else {
                    fileupload.removeFolder('../files/blog/' + id, function(err){
                        if (err) {
                            log.error('------removeFolder error: ' + err);
                        }
                        callback();
                    })

                }
            })
        }

        Articles.findOne({_id: req.body.id}, function(err, product){

            if (product){

                if (product.lang == 'default'){

                    Articles.find({parent: product._id}, function(err, products){
                        if (products && (products.length > 0)){

                            var counter = 0;
                            for (var i=0; i<products.length; i++){

                                removeProduct(products[i]._id, function(){

                                    counter ++;
                                    if (counter == products.length){

                                        removeProduct(product._id, function(err){
                                            if (err){
                                                res.send(err);
                                            } else {
                                                res.send({ok: "Ok"});
                                            }
                                        })
                                    }
                                });
                            }

                        } else {

                            removeProduct(product._id, function(err){
                                if (err){
                                    res.send(err);
                                } else {
                                    res.send({ok: "Ok"});
                                }
                            });
                        }
                    })

                } else {

                    removeProduct(product._id, function(err){
                        if (err){
                            res.send(err);
                        } else {
                            res.send({ok: "Ok"});
                        }
                    });
                }
            } else {
                res.send(Config.messages.error.db);
            }
        })

    } else if (req.body.action == 'searchtag'){

        var searchRequestStart = '^' + req.body.key + '.*';
        var searchRequestMiddle = ' ' + req.body.key + '.*';
        var params = {};
        var searchCondition = [{name: {$regex: searchRequestStart, $options: 'im'}}, {name: {$regex: searchRequestMiddle, $options: 'im'}}];
        params.$or = searchCondition;

        Tags.find(params).limit(8).exec(function(err, tags){

            if (tags && (tags.length > 0)){
                res.send({result: tags});
            } else {
                res.send({result : []});
            }

        })

    }

};