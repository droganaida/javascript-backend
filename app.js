
var express = require('express');
var http = require('http');
var path = require('path');
var log = require('./libs/log')(module);
var bodyParser = require('body-parser');
var myconfig = require('./libs/myconfig');
var session = require('express-session');
var async = require('async');
var favicon = require('express-favicon');
var multer  = require('multer');
var compression = require('compression');
var common = require('./common');
var cluster = require('cluster');

var app = express();

app.use(favicon(__dirname + '/public/images/icons/favicon.ico'));

// process.env.NODE_ENV = 'production';

// Для работы с garbage collector запустите проект с параметрами:
// node --nouse-idle-notification --expose-gc app.js

if (cluster.isMaster) {

    var cpuCount = require('os').cpus().length;

    for (var i = 0; i < cpuCount; i += 1) {
        cluster.schedulingPolicy = cluster.SCHED_NONE;
        cluster.fork();
    }

    cluster.on('exit', function (worker) {
        console.log('Worker ' + worker.id + ' died :(');
        cluster.fork();
    });

} else {

    app.use(compression());

    app.set('views', __dirname + '/templates');
    app.set('view engine', 'ejs');

    app.use(bodyParser.urlencoded({
        extended: true,
        limit: '50mb'
    }));

    app.use(multer(
        {
            dest: path.join(__dirname, 'public/uploads'),
            limits: {
                fieldNameSize: 999999999,
                fieldSize: 999999999
            }
        }
    ).any());

    app.use(express.static(path.join(__dirname, 'public')));
    app.use('/files', express.static('../files'));

    var sessionStore = require('./libs/sessionStore');
    app.use(session({
        secret: myconfig.session.secret,
        key: myconfig.session.key,
        cookie: myconfig.session.cookie,
        store: sessionStore
    }));


    //************************* Middleware ***********************************
    app.use(common.commonMiddleware);

    //************************* Routes ***********************************
    require('./routes')(app);

    //************************* GARBAGE магия ***********************************
    var gcInterval;
    function init()
    {
        gcInterval = setInterval(function() { gcDo(); }, 60000);
    }
    function gcDo()
    {
        global.gc();
        clearInterval(gcInterval);
        init();
    }
    init();
    //************************************************************

    //************************* 404 ***********************************
   app.use(function(req, res){

       res.locals.metatitle = '404 Ничего не найдено';
       res.locals.pagenoindex = 'yes';
       res.status(404).render('./client/error/error');
   });

    //************************* Запуск сервера ***********************************
    var httpServer = http.createServer(app);

    function onListening(){
        log.info('Listening on port %d', myconfig.port);
    }

    httpServer.on('listening', onListening);
    httpServer.listen(myconfig.port, '127.0.0.1');


}

process.on('uncaughtException', function (err) {
    log.error((new Date).toUTCString() + ' uncaughtException:', err.message);
    log.error(err.stack);
    process.exit(1);
});

