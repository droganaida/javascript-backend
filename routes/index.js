
module.exports = function(app){

//=====================================================//
//************ Admin ************//
//=====================================================//

    app.get('/admin', require('./admin/admin').get);
    app.post('/login', require('./admin/login').post);
    app.get('/admin/logout', require('./admin/logout').get);

    //====================== Categories ==========================//
    app.get('/admin/categories', require('./admin/categories').get);
    app.post('/admin/categories', require('./admin/editcategory').post);

    app.get('/admin/editcategory/:id', require('./admin/editcategory').get);
    app.get('/admin/editcategory/:id/:lang', require('./admin/editcategory').get);

    //====================== Articles ==========================//
    app.get('/admin/articles/:id', require('./admin/articles').get);
    app.post('/admin/articles', require('./admin/articles').post);

    app.get('/admin/article/:id/:label', require('./admin/editarticle').get);
    app.get('/admin/article/:id/:label/:lang', require('./admin/editarticle').get);
    app.post('/admin/article', require('./admin/editarticle').post);

//=====================================================//
//************ Client ************//
//=====================================================//

    //====================== Categories ==========================//
    app.get('/', require('./client/category').get);
    app.get('/:alias', require('./client/category').get);

    app.post('/', require('./client/category').post);

    //====================== Articles ==========================//
    app.get('/article/:alias', require('./client/article').get);

    //====================== Tags ==========================//
    app.get('/articles/:tag', require('./client/tag').get);
    app.post('/tag', require('./client/tag').post);

};