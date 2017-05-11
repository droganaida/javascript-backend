
//================================================================//
//*********** categories.js ***********//
//*********** © Aida Drogan - #BlondieCode
//*********** Логика работы с категориями
//*********** Создание новой категории
//*********** Сортировка категорий drag-n-drop (ui-sortable)
//*********** Удаление категории
//*********** Редактирование категории
//================================================================//

$(document).ready(function(){

    var errorTopMargin = 50;

    //================================================================//
    //*********** Создание новой категории ***********//
    //================================================================//

    $('#b-new-category').on('click', function(){

        //------------ pop-up форма для ввода данных

        $('body').append('<div class="popup-holder dynamic">' +
            '<div class="popup-content" style="height: 300px; width: 600px; margin-left: -300px; margin-top: -150px;">' +
            '<div class="popup-header">Создать новую категорию</div>' +
            '<div class="full">' +
            '<label for="title">Заголовок категории</label>' +
            '<input type="text" id="title">' +
            '<label for="alias">URL (без домена и /)</label>' +
            '<input type="text" id="alias">' +
            '</div>' +
            '<div class="clear centered">' +
            '<div class="button green" id="save-category">Сохранить</div>' +
            '<div class="button grey p-cancel">Отмена</div>' +
            '</div>' +
            '</div>' +
            '</div>'
        );

        $('.popup-holder.dynamic').fadeIn();

    });

    //------------ клик по кнопке Сохранить на pop-up форме

    $('body').on('click', '#save-category', function(){

        var button = $(this);

        if (!button.hasClass('working')){

            button.addClass('working');

            //------------ данные для ajax-запроса
            var data = {};
            data.title = $('#title').val(); // заголовок категории
            data.alias = $('#alias').val(); // алиас (url страницы)
            data.pos = $('#sortable li').length; // позиция в слайдере

            //------------ { ДОПИСАНО БЭКЭНД-ДЕВЕЛОПЕРОМ
            data.action = 'newcategory';
            data.moderator = $('#moderator').text();
            //------------ }

            if (data.title.length == 0){
                showError('Пожалуйста введите заголовок категории!', errorTopMargin);
                button.removeClass('working');
            } else if (data.alias.length == 0){
                showError('Пожалуйста введите роут!', errorTopMargin);
                button.removeClass('working');
            } else {

                //------------ { ДОПИСАНО БЭКЭНД-ДЕВЕЛОПЕРОМ
                $.ajax({
                    url: '/admin/categories',
                    type: 'POST',
                    dataType: 'json',
                    data: data,
                    error: function(data){
                        showError(data.responseText, errorTopMargin);
                        button.removeClass('working');
                    }
                }).done(function(data){

                    button.removeClass('working');
                    $('.popup-holder.dynamic').fadeOut('fast', function(){
                        $(this).remove();
                    });

                    $('#sortable').append(data.result);
                });
                //------------ }
            }
        }
    });

    //================================================================//
    //*********** Сортировка категорий ***********//
    //================================================================//

    function sortItems(){
        $('.ui-sortable-handle').each( function(){

            //------------ данные для ajax-запроса
            var data = {};
            data.pos = $(this).prevAll().length; // позиция в слайдере

            //------------ ajax-запрос на смену позиции категории (сортировка)
            //------------ { ДОПИСАНО БЭКЭНД-ДЕВЕЛОПЕРОМ
            data.id = $(this).attr('id');
            data.action = 'posupdate';

            $.ajax({
                url: "/admin/categories",
                type: 'POST',
                dataType: 'json',
                data: data
            });
            //------------ }

        })
    }

    if ($('#sortable').length){

        //------------ объявляем ui-sortable

        $('#sortable').sortable({
            deactivate: function(){
                sortItems();
            },
            placeholder: "ui-state-highlight"
        });

        //------------ отключаем выделение текста
        $('#sortable').disableSelection();
    }


    //================================================================//
    //*********** Удаление категории ***********//
    //================================================================//

    $('#delete-category').on('click', function(){

        $('body').append('<div class="popup-holder dynamic">' +
            '<div class="popup-content" style="height: 200px; width: 600px; margin-left: -300px; margin-top: -100px;">' +
            '<div class="popup-header">Удаление категории</div>' +
            '<div class="full">Вы действительно хотите удалить категорию ' + $('#title').val() +'?' +
            '</div>' +
            '<div class="clear centered">' +
            '<div class="button green" id="yes-delete-category">Удалить</div>' +
            '<div class="button grey p-cancel">Отмена</div>' +
            '</div>' +
            '</div>' +
            '</div>'
        );

        $('.popup-holder.dynamic').fadeIn();

    });

    $('body').on('click', '#yes-delete-category', function(){

        var button = $(this);

        if (!button.hasClass('working')){

            button.addClass('working');

            //------------ ajax-запрос на удаление категории
            //------------ { ДОПИСАНО БЭКЭНД-ДЕВЕЛОПЕРОМ
            var data = {};
            data.id = $('.id-info').attr('id');
            data.action = 'deletecategory';

            $.ajax({
                url: "/admin/categories",
                type: 'POST',
                dataType: 'json',
                data: data,
                error: function(){
                    showError('Невозможно удалить категорию!', errorTopMargin);
                    button.removeClass('working');
                }
            }).done(function(){

                $('.id-info').attr('id', 'deleted');
                window.location.href = "/admin/categories";
            });
            //------------ }
        }
    });


    //================================================================//
    //*********** Редактирование категории ***********//
    //================================================================//

    $('#edit-category').on('click', function(){

        var button = $(this);

        if (!button.hasClass('working')){

            button.addClass('working');

            //------------ данные для ajax-запроса
            var data = {};
            data.title = $('#title').val();
            data.shortdescription = $('#shortdescription').val();
            data.htmltitle = $('#htmltitle').val();
            data.htmldescription = $('#htmldescription').val();
            data.htmlkeywords = $('#htmlkeywords').val();
            data.alias = $('#alias').val();
            data.menutitle = $('#menutitle').val();
            data.moderator = $('#moderator').text();

            var ismain = 'false';
            if ($('.ismain').hasClass('active')){
                ismain = 'true';
            }

            data.ismain = ismain;
            data.description = mediaElement.saveDescription();

            //------------ { ДОПИСАНО БЭКЭНД-ДЕВЕЛОПЕРОМ
            data.id = $('.id-info').attr('id');
            data.parent = $('.id-info').attr('data-parent');
            var lang = $('.id-info').attr('data-lang');
            data.lang = lang;
            data.action = 'editcategory';
            //------------ }

            $('.loader').fadeIn('fast');

            //------------ ajax-запрос на сохраение категории
            //------------ { ДОПИСАНО БЭКЭНД-ДЕВЕЛОПЕРОМ
            $.ajax({
                url: '/admin/categories',
                type: 'POST',
                dataType: 'json',
                data: data,
                error: function(data){
                    showError(data.responseText, errorTopMargin);
                    button.removeClass('working');
                    $('.loader').fadeOut('fast');
                }
            }).done(function(data){

                var id = data.id;

                button.removeClass('working');
                $('.loader').fadeOut('fast');

                if ($('.id-info').attr('data-lang') == 'default'){
                    if ($('.crumbs').find('a').length){
                        window.location.href = $('.crumbs').find('a').attr('href');
                    } else {
                        window.location.href = '/admin/categories';
                    }
                } else {
                    window.location.href = window.location.href.substr(0, window.location.href.lastIndexOf('/'));
                }
            });
            //------------ }
        }
    });
});
