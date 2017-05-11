
var log = require('./log')(module);
var compressor = require('node-minify');
var config = require('../libs/myconfig');
var fs = require('fs');
var async = require('async');

function makeProduction(callback) {

    async.parallel([
        minifyAdminJs,
        minifyClientJs,
        minifyCss
    ], function(err){
        if (err){
            callback(err);
        } else {
            callback(null);
        }
    });
}

var scriptPath = config.homepath + '/public/scripts';

function minifyAdminJs(callback){

    var dir = scriptPath + '/admin/';
    var scripts = [
        dir + 'error.js',
        dir + 'mediadescription.js',
        dir + 'aliasmaker.js',
        dir + 'click-actions.js',
        dir + 'tags.js',
        dir + 'media-actions.js',
        dir + 'articles.js',
        dir + 'categories.js',
        dir + 'login.js'];

    compressor.minify({
        compressor: 'yui-js',
        input: scripts,
        output: dir + 'main.min.js',
        options: {
            'line-break': 80,
            charset: 'utf8'
        },
        callback: function (err) {
            if (err){
                callback(err);
            } else {
                callback(null);
            }
        }
    });

}

function minifyClientJs(callback){

    var dir = scriptPath + '/client/';
    var scripts = [
        dir + 'main.js'];

    compressor.minify({
        compressor: 'yui-js',
        input: scripts,
        output: dir + 'main.min.js',
        options: {
            'line-break': 80,
            charset: 'utf8'
        },
        callback: function (err) {
            if (err){
                callback(err);
            } else {
                callback(null);
            }
        }
    });
}

var cssPath = config.homepath + '/public/styles/';

function minifyCss(callback){

    var styles = [
        'admin.css',
        'main.css'];

    var counter = 0;
    var error = null;
    for (var i=0; i<styles.length; i++){

        compressor.minify({
            compressor: 'clean-css',
            input: cssPath + styles[i],
            output: cssPath + styles[i].substr(0, styles[i].lastIndexOf('.')) + '.min.css',
            options: {
                advanced: false,
                aggressiveMerging: false
            },
            callback: function (err) {
                counter ++;
                if (err) {
                    error = err;
                }
                if (counter == styles.length) {
                    callback(error);
                }
            }
        });

    }
}

process.stdout.write('makeProduction');
makeProduction(function(err){
    if (err) {
        log.error('============= makeProduction error ================ ' + err);
    } else {
        log.info('============== makeProduction success ===============');
    }
    process.exit();
});
