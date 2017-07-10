var log = require('../../libs/log')(module);
var MyConfig = require('../../libs/myconfig');
var Categories = require('../../models/categories').Category;
var fileupload = require('../../libs/fileupload');

exports.get = function(req, res){

    if (req.session.user) {

        res.locals.languages = MyConfig.languages;

        Categories.findOne({_id: req.params.id}, function(err, category){

            if (category){

                res.locals.page = "editcategory";
                res.locals.title = "Редактор категории " + category.title;

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
                res.send(err);
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

        var ismain = null;
        var alias = null;
        var isLocal = false;

        if (req.body.lang == 'default'){

           ismain = false;
           alias = req.body.alias;

            if (req.body.ismain == 'true'){
                ismain = true;

                Categories.setMain('all', false, function (err) {

                    if (err){
                        res.send(err);
                    } else {

                        editCategory(isLocal, function (err, id) {
                            if (err){
                                res.send(err);
                            } else {

                                Categories.setMain(req.body.id, true, function (err) {
                                    if (err){
                                        res.send(err);
                                    } else {
                                        res.send({id: id});
                                    }
                                });
                            }
                        });
                    }
                });

            } else {

                editCategory(isLocal, function (err, id) {
                    if (err){
                        res.send(err);
                    } else {
                        res.send({id: id});
                    }
                });
            }

        } else {

            Categories.findOne({_id: req.body.id}, function(err, category){

                if (!category){
                    isLocal = true;
                }

                editCategory(isLocal, function (err, id) {
                    if (err){
                        res.send(err);
                    } else {
                        res.send({id: id});
                    }
                });
            });
        }

        function editCategory(isLocal, callback) {

            if (isLocal) {
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
                            callback(err);
                        } else {
                            callback(null, result._id);
                        }
                    });
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
                    alias,
                    req.body.menutitle,
                    ismain,
                    req.body.moderator,

                    function(err){

                        if (err){
                            callback(err);
                        } else {
                            callback(null, req.body.id);
                        }
                    });
            }
        }
    } else if (req.body.action == 'deletecategory'){

        function removeCategory(id, callback){

            Categories.deleteCategory(id, function(err){
                if (err){
                    callback(err);
                } else {
                    callback(null);
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
