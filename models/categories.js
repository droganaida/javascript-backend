var log = require('../libs/log')(module);

var mongoose = require('../libs/mongoose'),

    Schema = mongoose.Schema;

var schema = new Schema({

    title: {
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
    menutitle: {
        type: String
    },
    htmlkeywords: {
        type: String
    },
    alias: {
        type: String
    },
    position: {
        type: Number,
        default: 0
    },
    lang: {
        type: String,
        default: 'default'
    },
    //------------ parent category for localization -------//
    parent: {
        type: String
    },
    ismain: {
        type: Boolean,
        default: false
    },
    creator: {
        type: String
    },
    created: {
        type: Date,
        default: Date.now()
    },
    moderatedhistory: {
        type: Array
    }
});

schema.index(
    {position: 1}
);

schema.statics = {

    createCategory: function(title, alias, position, creator, callback){

        var Categories = this;

        Categories
            .findOne({title:{$regex : new RegExp(title, "i")}})
            .then(function (category) {
                if (category) {
                    throw 'Категория с таким ЗАГОЛОВКОМ уже существует!';
                } else {
                    return Categories.findOne({alias: alias})
                }
            })
            .then(function (category) {
                if (category) {
                    throw 'Категория с таким URL уже существует!';
                } else {
                    var categoryDoc = new Categories({title: title, alias: alias, position: position, creator: creator});
                    return categoryDoc.save();
                }
            })
            .then( function (category) {
                callback (null, category);
            })
            .catch(function (err) {
                callback(err);
            });

    },
    createLocal: function(parent, language, title, shortdescription, description, htmltitle, htmldescription, htmlkeywords, menutitle, creator, callback){

        var Categories = this;

        Categories.findOne({_id: parent}, function (err, parentCategory) {

            if (parentCategory){

                var category = new Categories({

                    parent: parent,
                    lang: language,
                    title: title,
                    shortdescription: shortdescription,
                    description: description,
                    htmltitle: htmltitle,
                    htmldescription: htmldescription,
                    htmlkeywords: htmlkeywords,
                    menutitle: menutitle,
                    creator: creator,
                    ismain: parentCategory.ismain
                });

                category.save(function(err){

                    if (err) {
                        callback('Невозможно добавить категорию');
                    } else {
                        callback (null, category);
                    }
                })

            } else {
                callback('Невозможно добавить категорию');
            }
        });

    },
    setMain: function (parentId, isMain, callback) {

        var params = {};
        if (isMain){
            params = {parent: parentId}
        }

        var Categories = this;

        Categories.update(
            params,
            {$set: {
                ismain: isMain
            }},
            {multi: true},
            function(err){
                if (err){
                    callback(err);
                } else {
                    callback(null);
                }
            });
    },
    editCategory: function(language, categoryid, title, shortdescription, description, htmltitle, htmldescription, htmlkeywords, alias, menutitle, ismain, moderator, callback){

        var Categories = this;

        Categories.findOne({alias: alias, lang: 'default'}, function(err, cat){

            if (cat && (cat._id != categoryid)){
                callback('Категория с таким URL уже существует!');
            } else {
                var date = new Date();
                var setParams = {};
                setParams.title = title;
                setParams.shortdescription = shortdescription;
                setParams.description = description;
                setParams.htmltitle = htmltitle;
                setParams.htmldescription = htmldescription;
                setParams.htmlkeywords = htmlkeywords;
                setParams.menutitle = menutitle;

                if (language == 'default'){
                    setParams.alias = alias;
                    setParams.ismain = ismain;
                }

                Categories.update(
                    {_id:categoryid},
                    {
                        $set:setParams

                    }, function(err, opt){
                        if (opt){
                            var moderatedhistory = {};
                            moderatedhistory.moderator = moderator;
                            moderatedhistory.date = date;
                            Categories.update(
                                {_id: categoryid},
                                {
                                    $push: {moderatedhistory: moderatedhistory}
                                },
                                function(){
                                    callback(null, opt);
                                }
                            )
                        } else {
                            callback("Ошибка базы данных")
                        }
                    }
                )
            }
        });
    },
    posUpdate: function(categoryid, pos, callback) {

        var Categories = this;

        Categories.update(
            {_id:categoryid},
            {
                $set:{position: pos}

            }, function(err, opt){
                if (opt){
                    callback(null, opt);
                } else {
                    callback("Ошибка базы данных")
                }
            }
        )
    },
    deleteCategory: function(categoryid, callback){

        var Categories = this;

        Categories.remove({_id: categoryid}, function(err){
            if (err){
                callback ("Невозможно удалить категорию");
            } else {
                callback (null, categoryid);
            }
        });
    }
};

exports.Category = mongoose.model('Category', schema);
