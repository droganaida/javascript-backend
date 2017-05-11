var log = require('../libs/log')(module);

var mongoose = require('../libs/mongoose'),

    Schema = mongoose.Schema;

var schema = new Schema({

    title: {
        type: String
    },
    image: {
        type: String
    },
    description: {
        type: String
    },
    shortdescription: {
        type: String
    },
    htmltitle: {
        type: String
    },
    htmldescription: {
        type: String
    },
    htmlkeywords: {
        type: String
    },
    alias: {
        type: String
    },
    categories: {
        type: Array
    },
    tags: {
        type: Array
    },
    created: {
        type: Date,
        default: Date.now()
    },
    creator: {
        type: String
    },
    moderated: {
        type: Date
    },
    moderatedhistory: {
        type: Array
    },
    published: {
        type: Boolean,
        default: true
    },
    lang: {
        type: String,
        default: 'default'
    },
    //------------ id основной статьи для локализации -------//
    parent: {
        type: String
    },
    //------------ массив языков, на которые переведена статья ------------//
    locales: {
        type: Array
    },
    views: {
        type: Number,
        default: 0
    }
});

schema.index(
    {moderated: -1}
);

schema.index(
    {title: 'text', description: 'text', shortdescription: 'text'},
    {weights: {title:10, description:5, shortdescription: 5}},
    {language_override: "ru"}
);

schema.statics = {

    createArticle: function(title, shortdescription, htmltitle, htmldescription, description, htmlkeywords, alias,
                            categories, tags, creator, callback){

        var Articles = this;

        var date = new Date();
        var article = new Articles({
            title: title,
            shortdescription: shortdescription,
            description: description,
            htmltitle: htmltitle,
            htmldescription: htmldescription,
            htmlkeywords: htmlkeywords,
            alias: alias,
            categories: categories,
            tags:tags,
            creator: creator,
            moderated: date
        });
        article.save(function(err){
            if (err) {
                log.error("------ DB ERROR ----- " + err);
                callback('Невозможно добавить статью');
            } else {
                callback (null, article);
            }
        });
    },
    createLocal: function(parent, language, title, shortdescription, description, htmltitle, htmldescription, htmlkeywords,
                          tags, creator, callback){

        var Articles = this;

        var date = new Date();
        var article = new Articles({
            parent: parent,
            lang: language,
            title: title,
            shortdescription: shortdescription,
            description: description,
            htmltitle: htmltitle,
            htmldescription: htmldescription,
            htmlkeywords: htmlkeywords,
            tags:tags,
            creator: creator,
            moderated: date
        });
        article.save(function(err){
            if (err){
                log.error("------ DB ERROR ----- " + err);
                callback('Невозможно добавить статью');
            } else {
                Articles.update(
                    {_id: parent},
                    {
                        $push: {locales: language}
                    },
                    function(){
                        callback (null, article);
                    }
                );
            }
        });
    },
    editArticle: function(language, id, title, shortdescription, description, htmltitle, htmldescription, htmlkeywords, alias, categories, tags, moderator, callback){

        var Articles = this;
        var date = new Date();

        var setParams = {};
        setParams.title = title;
        setParams.shortdescription = shortdescription;
        setParams.description = description;
        setParams.htmltitle = htmltitle;
        setParams.htmldescription = htmldescription;
        setParams.htmlkeywords = htmlkeywords;

        if (language == 'default'){
            setParams.alias = alias;
            setParams.categories = categories;
        }

        setParams.tags = tags;
        setParams.moderated = date;

        Articles.update(
            {_id: id},
            {
                $set:setParams
            }, function(err, opt){
                if (opt){
                    var moderatedhistory = {};
                    moderatedhistory.moderator = moderator;
                    moderatedhistory.date = date;
                    Articles.update(
                        {_id: id},
                        {
                            $push: {moderatedhistory: moderatedhistory}
                        },
                        function(){
                            callback(null, opt);
                        }
                    )
                } else {
                    log.error("------ DB ERROR ----- " + err);
                    callback("Ошибка базы данных")
                }
            }
        )
    },
    saveMainImage: function(id, image, callback){

        var Articles = this;
        Articles.update(
            {_id: id},
            {
                $set: {image: image}
            }, function(err, opt){
                if (opt){
                    callback(null, opt);
                } else {
                    log.error("------ DB ERROR ----- " + err);
                    callback("Ошибка базы данных")
                }
            }
        )
    },
    setPublished: function(id, flag, callback){

        var Articles = this;
        var setParams = {};
        if (flag){
            setParams.published = true;
        } else {
            setParams.published = false;
        }

        Articles.update(
            {_id: id},
            {
                $set:setParams
            }, function(err, opt){
                if (opt){
                    callback(null, opt);
                } else {
                    log.error("------ DB ERROR ----- " + err);
                    callback("Ошибка базы данных")
                }
            }
        )
    },
    addView: function(id, callback){

        var Articles = this;

        Articles.update(
            {_id: id},
            {
                $inc: {views: 1}
            }, function(err, opt){
                if (opt){
                    callback(null, opt);
                } else {
                    log.error("------ DB ERROR ----- " + err);
                    callback("Ошибка базы данных")
                }
            }
        )

    },
    deleteArticle: function(id, callback){
        var Articles = this;

        Articles.findOne({_id: id}, function(err, article){

            if (article){

                if (article.lang == 'default'){

                    Articles.remove({parent: article._id}, function(){

                        Articles.remove({_id: article._id}, function(err){
                            if (err){
                                callback ("Невозможно удалить статью");
                            } else {
                                callback (null, id);
                            }
                        });
                    });
                } else {

                    Articles.update(
                        {_id: article.parent},
                        {
                            $pull: {locales: article.lang}
                        },
                        function(){

                            Articles.remove({_id: article._id}, function(err){
                                if (err){
                                    callback ("Невозможно удалить статью");
                                } else {
                                    callback (null, id);
                                }
                            });
                        }
                    )
                }
            } else {
                callback ("Невозможно удалить статью");
            }
        });

    }

};

exports.Article = mongoose.model('Article', schema);