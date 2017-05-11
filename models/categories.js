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
    icon: {
        type: String
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

        Categories.findOne({title:{$regex : new RegExp(title, "i")}}, function(err, categories){
            if (err){

                callback('Ошибка базы данных');
            } else {
                if (categories){

                    callback('Такая категория уже создана');
                } else {

                    var category = new Categories({title: title, alias: alias, position: position, creator: creator});

                    category.save(function(err){
                        if (err) {
                            callback('Невозможно добавить категорию');
                        } else {
                            callback (null, category);
                        }
                    })
                }
            }
        })
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
    editCategory: function(language, categoryid, title, shortdescription, description, htmltitle, htmldescription, htmlkeywords, alias, menutitle, ismain, moderator, callback){

        var Categories = this;
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