
module.exports = function(app){

//=====================================================//
//************ Admin ************//
//=====================================================//

    var startAdminRoute = require('./admin/admin');
    app.get('/admin', startAdminRoute.get);
    var loginRoute = require('./admin/login');
    app.post('/login', loginRoute.post);
    var logoutRoute = require('./admin/logout');
    app.get('/admin/logout', logoutRoute.get);

    //====================== Categories ==========================//
    var categoriesListRoute = require('./admin/categories');
    app.get('/admin/categories', categoriesListRoute.get);

    var editCategoryRoute = require('./admin/editcategory');
    app.post('/admin/categories', editCategoryRoute.post);

    app.get('/admin/editcategory/:id', editCategoryRoute.get);
    app.get('/admin/editcategory/:id/:lang', editCategoryRoute.get);

    //====================== Articles ==========================//
    var articlesListRoute = require('./admin/articles');
    app.get('/admin/articles/:id', articlesListRoute.get);
    app.post('/admin/articles', articlesListRoute.post);

    var editArticleRoute = require('./admin/editarticle');
    app.get('/admin/article/:id/:label', editArticleRoute.get);
    app.get('/admin/article/:id/:label/:lang', editArticleRoute.get);
    app.post('/admin/article', editArticleRoute.post);

//=====================================================//
//************ Client ************//
//=====================================================//

    //====================== Categories ==========================//
    var categoryRoute = require('./client/category');
    app.get('/', categoryRoute.get);
    app.get('/:alias', categoryRoute.get);

    app.post('/', categoryRoute.post);

    //====================== Articles ==========================//
    var articleRoute = require('./client/article');
    app.get('/article/:alias', articleRoute.get);

    //====================== Tags ==========================//
    var tagRoute = require('./client/tag');
    app.get('/articles/:tag', tagRoute.get);
    app.post('/tag', tagRoute.post);

};
