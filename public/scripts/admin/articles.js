
//================================================================//
//*********** articles.js ***********//
//*********** © Aida Drogan - #BlondieCode
//*********** Логика работы со статьями
//*********** Поиск по статьям
//*********** Создание новой стаьи
//*********** Удаление статьи
//*********** Редактирование статьи
//*********** Публикация статьи и снятие с публикации
//================================================================//

$(document).ready(function(){

    var errorTopMargin = 50;

    //================================================================//
    //*********** Создание статьи по запросу ***********//
    //================================================================//

    $('#search-article').on('keyup', function(e){

        if ($(this).val().length > 1){

            //------------ данные для ajax-запроса
            var data = {};
            data.key = $(this).val();

            //------------ { ДОПИСАНО БЭКЭНД-ДЕВЕЛОПЕРОМ
            data.action = 'searcharticle';
            data.catid = window.location.href.substr(window.location.href.lastIndexOf('/') + 1);

            //------------ ajax-запрос на поиск статьи

            $.ajax({
                url: "/admin/articles",
                type: 'POST',
                dataType: 'json',
                data: data,
                error: function(){
                    showError('Ошибка базы данных!', errorTopMargin);
                }
            }).done(function(data){

                //------------ data.result - ответ от сервера (найденная статья)

                $('.articles').children().remove();
                $('.articles').append(data.result);

                //------------ если ничего не найдено по запросу
                if (data.result.length == 0){
                    $('.articles').append('<div class="notfound">Ой... Похоже ничего не найдено!</div>')
                }

            });
            //------------ }
        }
    });

    //------------------ функция для подстановки тегов tagMeBabe

    if ($('#tags').length){

        var tagInput = $('#tags'); // элемент для ввода тега
        var tagAutoFillBar = $('.autofill-bar'); // панель для вывода результатов подстановки
        var tagAutoFillClass = 'autofill-bar'; // класс панели для вывода результатов подстановки (String)
        var tagContainer = $('#article-tags'); // контейнер для выгрузки выбранных тегов
        var tagItemClass = 't-item'; // класс элемента с тегом в контейнере
        var routeToTagSearch = '/admin/article'; // роут для ajax-запроса к серверу (совпадение тегов для постановки)

        tagMeBabe(tagInput, tagAutoFillBar, tagAutoFillClass, tagContainer, tagItemClass, routeToTagSearch);
    }


    //================================================================//
    //*********** Сохранение статьи ***********//
    //================================================================//

    function saveArticle(type, button){

        //--------------- button - кнопка, с которой был переход
        //--------------- type - новая статья или редактирование существующей

        if (!button.hasClass('working')){

            //------------ { ДОПИСАНО БЭКЭНД-ДЕВЕЛОПЕРОМ
            //------------ на каком языке статья
            var lang = $('.id-info').attr('data-lang');
            //------------ }

            //--------------- проверка выбрана ли хоть одна категория
            //------------ ДОПИСАНО БЭКЭНД-ДЕВЕЛОПЕРОМ (lang != 'default')
            if (($('#article-categories .active').length > 0) || (lang != 'default')){

                //--------------- проверка на обязательные поля
                if ($('#title').val().length == 0){
                    showError('Введите название статьи!', errorTopMargin);
                } else if ((lang == 'default') && ($('#alias').val().length == 0)) {
                    showError('Введите URL статьи!', errorTopMargin);
                } else {

                    button.addClass('working');

                    //------------ данные для ajax-запроса
                    var data = {};

                    //--------------- передать тип на сервер!
                    data.action = type;

                    //------------ { ДОПИСАНО БЭКЭНД-ДЕВЕЛОПЕРОМ
                    //------------ если это edit, нужно передать id
                    if (type == 'editarticle'){
                        data.id = $('.id-info').attr('id');
                    }
                    //------------ }

                    data.title = $('#title').val();
                    data.alias = $('#alias').val();
                    data.shortdescription = $('#shortdescription').val();
                    data.htmltitle = $('#htmltitle').val();
                    data.htmldescription = $('#htmldescription').val();
                    data.htmlkeywords = $('#htmlkeywords').val();
                    data.moderator = $('#moderator').text();

                    //------------ { ДОПИСАНО БЭКЭНД-ДЕВЕЛОПЕРОМ
                    //------------ передаем статью-оригинал на русском языке и сам язык
                    data.parent = $('.id-info').attr('data-parent');
                    data.lang = lang;
                    //------------ }

                    var catArray = [];
                    $('#article-categories .active').each(function(){
                        //------------ { ДОПИСАНО БЭКЭНД-ДЕВЕЛОПЕРОМ
                        //------------ собираем не текст с категорий, а id
                        catArray.push($(this).attr('id'));
                        //------------ }
                    });
                    data.categories = catArray;

                    var tagArray = [];
                    $('#article-tags .t-item').each(function(){
                        tagArray.push($(this).text());
                    });
                    data.tags = tagArray;

                    data.description = mediaElement.saveDescription();

                    $('.loader').fadeIn('fast');

                    //------------ { ДОПИСАНО БЭКЭНД-ДЕВЕЛОПЕРОМ
                    $.ajax({
                        url: '/admin/article/',
                        type: 'POST',
                        dataType: 'json',
                        data: data,
                        error: function(data){
                            showError(data.responseText, errorTopMargin);
                            button.removeClass('working');
                            $('.loader').fadeOut('fast');
                        }
                    }).done(function(data){

                        var articleid = data.id;

                        if (globalArticleMainImageFileNameToUpload){
                            var fd = new FormData();

                            fd.append('fileUpload', globalArticleMainImageFileNameToUpload);
                            fd.append('action', 'savemainimage');
                            fd.append('id',  articleid);

                            var xhr = new XMLHttpRequest();
                            xhr.open('post', '/admin/article/', true);
                            xhr.send(fd);

                            xhr.onreadystatechange = function() {
                                if (this.readyState == 4) {
                                    if (xhr.responseText != 'Success'){
                                        showError(xhr.responseText, errorTopMargin);
                                        button.removeClass('working');
                                        $('.loader').fadeOut('fast');
                                    } else {
                                        afterSave();
                                    }
                                }
                            }
                        } else {
                            afterSave();
                        }
                    });

                    function afterSave() {

                        button.removeClass('working');
                        $('.loader').fadeOut('fast');
                        var href = window.location.href;
                        href = href.substr(0, href.lastIndexOf('/'));
                        if ($('.id-info').attr('data-lang') == 'default'){
                            href = href.replace('article', 'articles');
                        }
                        window.location.href = href;
                    }
                    //------------ }
                }

            } else {
                showError('Выберите хотя бы одну категорию!', errorTopMargin);
            }
        }
    }

    //================================================================//
    //*********** Редактирование статьи ***********//
    //================================================================//

    $('#edit-article').on('click', function(){

        var button = $(this);

        //----------- проверяем нужно ли удалить старое изображение
        if (button.hasClass('todelete')){

            var data = {};

            //------------ { ДОПИСАНО БЭКЭНД-ДЕВЕЛОПЕРОМ
            data.id = $('.id-info').attr('id');
            data.action = 'deletemainimg';
            data.file = '..' + button.attr('data-src');

            $.ajax({
                url: '/admin/article/',
                type: 'POST',
                dataType: 'json',
                data: data,
                error: function(data){
                    showError(data.responseText, errorTopMargin);
                }
            }).done(function(){
                saveArticle('editarticle', button);
            });
            //------------ }
        }

        saveArticle('editarticle', button);

    });

    //================================================================//
    //*********** Новая статья ***********//
    //================================================================//

    $('#new-article').on('click', function(){

        var button = $(this);
        saveArticle('newarticle', button);

    });

    //================================================================//
    //*********** Удаление статьи ***********//
    //================================================================//

    $('#delete-article').on('click', function(){

        $('body').append('<div class="popup-holder dynamic">' +
            '<div class="popup-content" style="height: 200px; width: 600px; margin-left: -300px; margin-top: -100px;">' +
            '<div class="popup-header">Удаление статьи</div>' +
            '<div class="full">Вы действительно хотите удалить статью ' + $('#title').val() +'?' +
            '</div>' +
            '<div class="clear centered">' +
            '<div class="button green" id="yes-delete-article">Удалить</div>' +
            '<div class="button grey p-cancel">Отмена</div>' +
            '</div>' +
            '</div>' +
            '</div>'
        );

        $('.popup-holder.dynamic').fadeIn();

    });

    $('body').on('click', '#yes-delete-article', function(){

        var button = $(this);

        if (!button.hasClass('working')){

            button.addClass('working');

            //------------ { ДОПИСАНО БЭКЭНД-ДЕВЕЛОПЕРОМ
            var data = {};
            data.action = 'deletearticle';
            data.id = $('.id-info').attr('id');

            $.ajax({
                url: "/admin/article",
                type: 'POST',
                dataType: 'json',
                data: data,
                error: function(){
                    showError('Невозможно удалить статью!', errorTopMargin);
                    button.removeClass('working');
                }
            }).done(function(data){

                window.location.href = "/admin/categories";
                var href = window.location.href;
                href = href.substr(0, href.lastIndexOf('/'));

                if ($('.id-info').attr('data-lang') == 'default'){
                    $('.id-info').attr('id', 'deleted');
                    href = "/admin/categories";
                }
                window.location.href = href;
            });
            //------------ }
        }
    });

    //================================================================//
    //*********** Публикация статьи ***********//
    //================================================================//

    $('.articles').on('click', '.published span', function(){

        var button = $(this);

        //------------ данные для ajax-запроса
        var data = {};
        var flag = 'yes';
        if (button.hasClass('yes')){
            flag = 'no';
        }
        data.flag = flag;

        //------------ { ДОПИСАНО БЭКЭНД-ДЕВЕЛОПЕРОМ
        data.id = button.parent().parent().attr('id');
        data.action = 'setpublished';

        $.ajax({
            url: '/admin/article/',
            type: 'POST',
            dataType: 'json',
            data: data,
            error: function(){
                showError('Ошибка базы данных', errorTopMargin);
            }
        }).done(function(){

            if (flag == 'yes'){
                button.removeClass('no').addClass('yes').text('Опубликована');
                showSuccess('Статья опубликована', errorTopMargin);
            } else {
                button.removeClass('yes').addClass('no').text('Не опубликована');
                showSuccess('Статья снята с публикации', errorTopMargin);
            }
        });
        //------------ }
    });
});