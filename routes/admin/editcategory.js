var log = require('../../libs/log')(module);
var MyConfig = require('../../libs/myconfig');
var Categories = require('../../models/categories').Category;
var fileupload = require('../../libs/fileupload');

exports.get = function(req, res){

    if (req.session.user) {

        res.locals.languages = MyConfig.languages;
        res.locals.icons = MyConfig.icons;

        Categories.findOne({_id: req.params.id}, function(err, category){

            if (category){

                if (
                    (res.locals.adminrights == 'superadmin') ||
                    ((res.locals.adminrights == 'blog') && (category.cattype == 'blogCategory')) ||
                    (res.locals.adminrights.toString() == category.rootcategory.toString()) ||
                    (res.locals.adminrights.toString() == category._id.toString())
                ){

                    res.locals.page = "editcategory";
                    res.locals.title = "Редактор категории " + category.title;
                    res.locals.crumbs = "";

                    Categories.find({isroot: true}, function(err, roots){

                        if (roots &&(roots.length > 0)){
                            res.locals.roots = roots;
                            for (var i=0; i<roots.length; i++){
                                if (category.rootcategory == roots[i]._id){
                                    res.locals.crumbs = '<a href="/admin/categories/' + roots[i]._id + '">' + roots[i].title + '</a> > ' + category.title;
                                }
                            }
                        } else {
                            res.locals.roots = [];
                        }

                        if (req.params.lang){

                            Categories.findOne({parent: req.params.id, lang: req.params.lang}, function(err, lcategory){

                                res.locals.lang = req.params.lang;
                                res.locals.parent = req.params.id;

                                if (lcategory){

                                    res.locals.category = lcategory;

                                } else {

                                    var tempCat = {};
                                    tempCat.title = '';
                                    tempCat.alias = '';
                                    tempCat.shortdescription = '';
                                    tempCat.htmltitle = '';
                                    tempCat.htmldescription = '';
                                    tempCat.htmlkeywords = '';
                                    tempCat.menutitle = '';
                                    tempCat.cattype = category.cattype;

                                    res.locals.category = tempCat;
                                }

                                res.render('./admin/editcategory/editcategory');
                            })

                        } else {

                            res.locals.category = category;
                            res.locals.lang = "default";
                            res.locals.parent = 'me';
                            res.render('./admin/editcategory/editcategory');
                        }
                    })

                } else {

                    res.render('./admin/login/login');
                }


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

    if (req.body.action == 'newcategory'){

        Categories.findOne({alias: req.body.alias}, function(err, cat){

            if (cat){

                res.send("Категория с таким URL уже существует!")

            } else {

                Categories.createCategory(req.body.title, req.body.alias, req.body.pos, req.body.moderator, function(err, category){
                    if (category){
                        var page = 'categories';

                        category.subcount = 0;
                        res.render('./admin/categories/item', {item:category, page:page}, function(err, html){
                            if (err){
                                log.error('------------- Error: ' + err);
                                res.send({result: ''});
                            } else {
                                res.send({result: html});
                            }
                        });
                    } else {
                        res.send(err)
                    }
                });
            }

        });

    } else if (req.body.action == 'posupdate'){

        Categories.posUpdate(req.body.id, req.body.pos, function(err){
            if (err){
                res.send(err);
            } else {
                res.send({ok: "Ok"});
            }
        })

    } else if (req.body.action == 'editcategory'){

        Categories.findOne({alias: req.body.alias, lang: 'default'}, function(err, cat){

            if (cat && (cat._id != req.body.id)){

                res.send("Категория с таким URL уже существует!")

            } else {

                if (req.body.lang == 'default'){

                    var ismain = false;

                    if (req.body.ismain == 'true'){
                        ismain = true;

                        Categories.update(
                            {},
                            {$set: {
                                    ismain: false
                                }},
                            {multi: true},
                            function(err){

                                if (err){
                                    res.send(err);
                                } else {

                                    Categories.editCategory(req.body.lang,
                                        req.body.id,
                                        req.body.title,
                                        req.body.shortdescription,
                                        req.body.description,
                                        req.body.htmltitle,
                                        req.body.htmldescription,
                                        req.body.htmlkeywords,
                                        req.body.alias,
                                        req.body.menutitle,
                                        ismain,
                                        req.body.moderator,

                                        function(err){

                                            if (err){
                                                res.send(err);
                                            } else {

                                                Categories.update(
                                                    {parent: req.body.id},
                                                    {$set: {
                                                        ismain: true
                                                    }},
                                                    {multi: true},
                                                    function(err){

                                                        if (err){
                                                            res.send(err);
                                                        } else {
                                                            res.send({id: req.body.id});
                                                        }
                                                    });
                                            }

                                    });
                                }
                            }
                        )

                    } else {

                        Categories.editCategory(
                            req.body.lang,
                            req.body.id,
                            req.body.title,
                            req.body.shortdescription,
                            req.body.description,
                            req.body.htmltitle,
                            req.body.htmldescription,
                            req.body.htmlkeywords,
                            req.body.alias,
                            req.body.menutitle,
                            ismain,
                            req.body.moderator,

                            function(err){

                                if (err){
                                    res.send(err);
                                } else {
                                    res.send({id: req.body.id});
                                }
                        });
                    }

                } else {

                    Categories.findOne({_id: req.body.id}, function(err, category){

                        if (category){

                            Categories.editCategory(
                                req.body.lang,
                                req.body.id,
                                req.body.title,
                                req.body.shortdescription,
                                req.body.description,
                                req.body.htmltitle,
                                req.body.htmldescription,
                                req.body.htmlkeywords,
                                null,
                                req.body.menutitle,
                                null,
                                req.body.moderator,

                                function(err){

                                    if (err){
                                        res.send(err);
                                    } else {
                                        res.send({id: req.body.id});
                                    }
                            });
                        } else {

                            Categories.createLocal(
                                req.body.parent,
                                req.body.lang,
                                req.body.title,
                                req.body.shortdescription,
                                req.body.description,
                                req.body.htmltitle,
                                req.body.htmldescription,
                                req.body.htmlkeywords,
                                req.body.menutitle,
                                req.body.moderator,

                                function(err, result){

                                    if (err){
                                        res.send(err);
                                    } else {
                                        res.send({id: result._id});
                                    }
                            })
                        }
                    })
                }
            }
        });

    } else if (req.body.action == 'savedescription'){

        Categories.saveDescription(req.body.id, req.body.html, function(err){
            if (err){
                res.send(err);
            } else {
                res.send({ok: "Ok"});
            }
        });

    } else if (req.body.action == 'deletecategory'){

        function removeCategory(id, callback){

            Categories.deleteCategory(id, function(err){
                if (err){
                    callback(err);
                } else {
                    fileupload.removeFolder('../files/categories/' + id, function(err){
                        if (err) {
                            log.error('------removeFolder error: ' + err);
                        }
                        callback();
                    })
                }
            })
        }

        Categories.findOne({_id: req.body.id}, function(err, category){

            if (category){

                if (category.lang == 'default'){

                    Categories.find({parent: category._id}, function(err, categories){
                        if (categories && (categories.length > 0)){

                            var counter = 0;
                            for (var i=0; i<categories.length; i++){

                                removeCategory(categories[i]._id, function(){

                                    counter ++;
                                    if (counter == categories.length){

                                        removeCategory(category._id, function(err){
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

                            removeCategory(category._id, function(err){
                                if (err){
                                    res.send(err);
                                } else {
                                    res.send({ok: "Ok"});
                                }
                            });
                        }
                    })

                } else {

                    removeCategory(category._id, function(err){
                        if (err){
                            res.send(err);
                        } else {
                            res.send({ok: "Ok"});
                        }
                    });
                }
            } else {
                res.send(MyConfig.messages.error.db);
            }
        })
    }
};