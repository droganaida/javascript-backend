
var log = require('../libs/log')(module);
var async = require('async');

var mongoose = require('../libs/mongoose'),
    Schema = mongoose.Schema;

var schema = new Schema({
    name: {
        type: String,
        unique: true,
        required: true
    },
    created: {
        type: Date,
        default: Date.now
    }
});

schema.index(
    {name: 1},
    {unique: true, dropDups: true}
);

schema.statics = {

    createTags: function (name, callback) {

        var Tags = this;

        name = name.toLowerCase();

        Tags.findOne({name: name}, function(err, tagresult){

            if (tagresult){

                callback (null, 1);

            } else {

                var tag = new Tags({name: name});

                tag.save(function(err){

                    if (err) {
                        callback(err);
                    } else {
                        callback (null, tag);
                    }
                });
            }
        })
    }
};

exports.Tags = mongoose.model('Tags', schema);
