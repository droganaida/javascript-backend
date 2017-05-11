
//=================================================================//
//************* File Upload library fs + imagemagick **************//
//********************* © #BlondieCode ****************************//
//=================================================================//

var log = require('./log')(module);
var fs = require('fs');
var im = require('imagemagick');
var async = require('async');

//================================================================================================//
//============================ Удаление файла ================================//
//================================================================================================//

function fileUnlink(file, callback){

    fs.exists(file, function(exist){
        if (exist){
            fs.unlink(file, function(err){
                if (err){
                    callback('Could not remove file');
                } else {
                    callback(null, 'Success');
                }
            })
        } else {
            callback(null, 'Success');
        }
    });
}

//================================================================================================//
//============================ Удаление директории ================================//
//================================================================================================//

function removeFolder(location, next) {

    fs.exists(location, function(exist){

        if (exist){

            fs.readdir(location, function (err, files) {

                if (files && (files.length > 0)){

                    async.each(files, function (file, cb) {

                        file = location + '/' + file;
                        fs.stat(file, function (err, stat) {
                            if (err) {
                                cb(err);
                            }
                            if (stat.isDirectory()) {
                                removeFolder(file, cb);
                            } else {
                                fs.unlink(file, function (err) {
                                    if (err) {
                                        cb(err);
                                    }
                                    cb();
                                })
                            }
                        });
                    }, function (err) {
                        if (err) {
                            next(err);
                        }
                        fs.rmdir(location, function (err) {
                            next(err);
                        });
                    })
                } else {
                    fs.rmdir(location, function (err) {
                        next(err);
                    });
                }
            })
        } else {
            next(null);
        }
    });
}

//================================================================================================//
//=========================== Служебные функции для создания слайдов =============================//
//================================================================================================//

function imResize(file, width, height, dest, callback){
    
    im.resize({
        srcPath: file,
        dstPath: dest,
        width: width,
        height: height
    }, function(err){
        if (err){
            log.error('------ Error: ' + err);
            callback(err);
        } else {

            callback(null, "Success");
        }
    })
}

function sqCrop(fileName, size, features, callback){

    var ext = fileName.substr(fileName.lastIndexOf('.'));

    var fileTemp = fileName.substr(0, fileName.lastIndexOf('.')) + '-temp' + ext;
    var fileThumb = fileName.substr(0, fileName.lastIndexOf('.')) + '-min' + ext;

    if (features.width >= features.height){

        var x = (features.width - features.height)/2;
        var y = features.height;

        if (x%1 == 0){
            x = x + 0.5;
        }

        im.convert([fileName, "-crop", y+"x"+y+"+" + x + "+" + "0", fileTemp], function(){
            imResize(fileTemp, size, size, fileThumb, function(err){
                if (err){
                    callback(err);
                } else {
                    
                    fileUnlink(fileTemp, function(err){
                        if (err){
                            callback(err);
                        } else {
                            callback(null, "Success");
                        }
                    });
                }
            })
        })

    } else if (features.width < features.height){

        var x = (features.height - features.width)/2;
        var y = features.width;

        if (x%1 == 0){
            x = x + 0.5;
        }

        im.convert([fileName, "-crop", y+"x"+y+"+0+"+x, fileTemp], function(){

            imResize(fileTemp, size, size, fileThumb, function(err){

                if (err){
                    callback(err);
                } else {
                    fileUnlink(fileTemp, function(err){
                        if (err){
                            callback(err);
                        } else {
                            callback(null, "Success");
                        }
                    });
                }
            })
        })
    } else {

        imResize(fileName, 120, 120, fileThumb, function(err){
            if (err){
                callback(err);
            } else {
                callback(null, "Success");
            }
        })
    }
}

function slideCrop(fileName, width, height, features, callback) {

    var ext = fileName.substr(fileName.lastIndexOf('.'));

    var fileTemp = fileName.substr(0, fileName.lastIndexOf('.')) + '-temp' + ext;
    var fileSlide = fileName.substr(0, fileName.lastIndexOf('.')) + '-slide' + ext;

    var magickprop = width/height;
    var prop = features.width/features.height;

    function fullCrop() {

        if (prop >= magickprop){

            var v = (features.width - features.height*magickprop)/2;
            var h = features.height;

            im.convert([fileName, "-crop", (magickprop*h)+"x" + h + "+" + v + "+" + "0", fileTemp], function(){

                imResize(fileTemp, width, height, fileSlide, function(err){
                    if (err){
                        callback(err);
                    } else {

                        fileUnlink(fileTemp, function(err){
                            if (err){
                                callback(err);
                            } else {
                                callback(null, "Success");
                            }
                        });
                    }
                })
            })

        } else {

            var tempH = features.width/magickprop;
            var deltaH = features.height - tempH;

            im.convert([fileName, "-crop", features.width + "x" + tempH + "+0+" + deltaH/2, fileTemp], function(){
                imResize(fileTemp, width, height, fileSlide, function(){

                    fileUnlink(fileTemp, function(err){

                        if (err){
                            callback(err);
                        } else {
                            callback(null, "Success");
                        }
                    });
                })
            })
        }
    }

    function partCrop() {

        if (prop >= magickprop){

            fullCrop();

        } else {

            var v = features.width;
            var h = features.width/magickprop;

            var deltaH = features.height - h;

            im.convert([fileName, "-crop", v + "x" + h + "+0+" + deltaH/2, fileTemp], function(){
                imResize(fileTemp, width, height, fileSlide, function(){

                    fileUnlink(fileTemp, function(err){

                        if (err){
                            callback(err);
                        } else {
                            callback(null, "Success");
                        }
                    });
                })
            })
        }
    }

    if (features.width < features.height){
        if (magickprop < 1){
            partCrop();
        } else {
            fullCrop();
        }

    } else if (features.width >= features.height){
        if (magickprop < 1){
            fullCrop();
        } else {
            partCrop();
        }
    }
}

//============================================================//
//============= Сохранение файла =============//
//============================================================//

function saveFile(saveDir, fileToUpload, alias, callback){

    var ext = fileToUpload.originalname.substr(fileToUpload.originalname.lastIndexOf('.'));
    var rootDir = '../files/';
    var rootLink = '/files/';

    if (saveDir.indexOf('\\') != -1){
        saveDir.replace(/\\/g, '/');
    }

    if (saveDir[0] == '/'){
        saveDir = saveDir.substr(1, saveDir.length-1);
    }
    if (saveDir[saveDir.length - 1] != '/'){
        saveDir = saveDir + '/';
    }
    var dirArray = saveDir.split('/');

    var fileAlias = fileToUpload.originalname;
    if (alias && (alias != '')) {
        if (alias.indexOf('.') != -1){
            fileAlias = alias;
        } else {
            fileAlias = alias + ext;
        }
    }
    var fileName = rootDir + saveDir + fileAlias;
    var fileLink = rootLink + saveDir + fileAlias;

    var dCounter = 0;
    for (var d=0; d<dirArray.length; d++){

        if (dirArray[d] != ''){

            var subDir = dirArray[d];
            if (d == 0){
                subDir = rootDir + subDir;
            } else {
                var tail = '';
                for (var sd=d; sd>0; sd--){
                    tail = dirArray[sd-1] + '/' + tail;
                }
                subDir = rootDir + tail + subDir;
            }

            checkDir(subDir, function(err){
                if (err){
                    callback('Could not create directory!')
                } else {

                    dCounter ++;
                    if (dCounter == dirArray.length){
                        saveImg(fileName, function(err){
                            if (err){
                                callback(err);
                            } else {
                                callback(null, fileLink);
                            }
                        });
                    }
                }
            });
        } else {

            dCounter ++;
            if (dCounter == dirArray.length){
                saveImg(fileName, function(err){
                    if (err){
                        callback(err);
                    } else {
                        callback(null, fileLink);
                    }
                });
            }
        }
    }

    function checkDir(dir, callback){

        if(!fs.existsSync(dir)){

            fs.mkdir(dir, function(err){
                if (err){
                    callback('Could not make dir');
                } else {
                    callback(null);
                }
            })
        } else {
            callback(null);
        }
    }

    function saveImg(fileName, callback){

        var fileBuffer = fs.readFileSync(fileToUpload.path);

        fs.writeFile(fileName, fileBuffer, function(err){
            if (err){
                log.error('------ Error: ' + err);
                callback('Could not upload file');
            } else {
                fileUnlink(fileToUpload.path, function(err){
                    if (err){
                        callback(err);
                    } else {
                        callback(null);
                    }
                });
            }
        })
    }
}

//******************************* EXPORTS ************************************//


//============================================================================================================================//
//================================== Функция нарезки слайда =================================================//
//-------------- fileName - путь к файлу
//-------------- width - ширина слайда
//-------------- height - высота слайда
//============================================================================================================================//

exports.slideCrop = function(fileName, width, height, callback){

    im.identify(fileName, function(err, features){
        if (err) {
            callback(err);
        } else {

            if ((features.width < width) || (features.height < height)){
                callback('Выбери картинку побольше!');
            } else {

                slideCrop(fileName, width, height, features, function (err, result) {
                    callback(err, result);
                });
            }
        }
    })
};

//============================================================================================================================//
//================================== Функция нарезки квадратной превьюшки =================================================//
//-------------- fileName - путь к файлу
//-------------- size - сторона слайда
//============================================================================================================================//

exports.sqCrop = function(fileName, size, callback){

    im.identify(fileName, function(err, features){
        if (err) {
            callback(err);
        } else {

            if ((features.width < size) || (features.height < size)){
                callback('Выбери картинку побольше!');
            } else {
                sqCrop(fileName, size, features, function (err, result) {
                    callback(err, result);
                })
            }
        }
    })
};

//============================================================================================================================//
//================================== Удаление файла =================================================//
//-------------- file - путь к файлу
//============================================================================================================================//

exports.fileUnlink = function(file, callback){

    fileUnlink(file, function(err, result){
        if (err){
            callback(err);
        } else {
            callback(null, result);
        }
    });
};


//============================================================================================================================//
//================================== Удаление директории =================================================//
//-------------- path - путь к директории
//============================================================================================================================//

exports.removeFolder = function(path, callback){

    removeFolder(path, function(err){
        callback(err);
    })
};

//============================================================================================================================//
//================================== Сохранение файла с оптимизацией =================================================//
//-------------- saveDir - директория для сохранения
//-------------- fileToUpload - файл для сохранения
//-------------- alias - имя конечного файла
//-------------- maxSide - размер максимальной стороны изображения
//============================================================================================================================//

exports.saveWithResizeFile = function(saveDir, fileToUpload, alias, maxSide, callback){


    saveFile(saveDir, fileToUpload, alias, function(err, filelink){

        if (err){
            callback(err);
        } else {

            var path = '..' + filelink;

            im.identify(path, function(err, features){
                if (err) {
                    callback(err);
                } else {

                    if ((features.width <= maxSide) && (features.height <= maxSide)){

                        callback(null, filelink);

                    } else {

                        var prop = features.width/features.height;
                        var height = maxSide;
                        var width = prop * features.height;

                        if (prop >=1){
                            width = maxSide;
                            height = prop * features.width;
                        }

                        imResize(path, width, height, path, function(err){
                            if (err){
                                callback(err);
                            } else {

                                im.convert([path, "-strip", "-interlace", "plane", "-quality", ""+ 75 +"%", path], function (err) {
                                    if (err){
                                        callback(err);
                                    } else {
                                        callback(null, filelink);
                                    }
                                });
                            }
                        })
                    }
                }
            });
        }
    });
};

//============================================================================================================================//
//================================== Сохранение файла =================================================//
//-------------- saveDir - директория для сохранения
//-------------- fileToUpload - файл для сохранения
//-------------- alias - имя конечного файла
//============================================================================================================================//


exports.saveFile = function(saveDir, fileToUpload, alias, callback){

    saveFile(saveDir, fileToUpload, alias, function(err, filelink){

        if (err){
            callback(err);
        } else {
            callback(null, filelink);
        }
    });
};
