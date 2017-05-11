
$(document).ready(function () {

    $('body').on('click', '.more', function () {

        var button = $(this);
        var container = $('.article-holder');
        var postLink = '/';

        if (!button.hasClass('working')){
            button.addClass('working');
            var data = {};
            data.action = 'more';
            data.last = button.attr('data-last');
            data.language = button.attr('data-language');

            if (button.attr('data-tag')){
                postLink = '/tag';
                data.tag = button.attr('data-tag');
            } else {
                data.category = button.attr('data-category');
                data.ismain = button.attr('data-ismain');
            }
        }
        $.ajax({
            url: postLink,
            type: 'POST',
            dataType: 'json',
            data: data,
            error: function(){
                button.removeClass('working');
            }
        }).done(function(data){
            container.append(data.html);
            if (data.last && (data.last != 'none')){
                button.attr('data-last', data.last);
                button.removeClass('working');
            } else {
                button.remove();
            }
        });
    });
});

$(window).load(function(){

    var winHeight = $(document).height();
    var step = 4;
    var timeToScroll = winHeight/step;

    $('.scrolltop').on('click', function(){

        $('html, body').animate({
            scrollTop: 0
        }, timeToScroll);
    });

});

//********************** {БЛАГОДАРНОСТЬ} ********************//
//----------- Кнопка-скроллер скрыта до момента скролла в 100px от верха страницы
//----------- Автор правки Ванильный Ниндзя
//----------- https://www.youtube.com/channel/UCe-yBRRbvK2NNyIOrE-UTIA
//****************** {БЛАГОДАРНОСТЬ КОНЕЦ} *****************//
$(window).scroll(function(){

    if ($(document).scrollTop() > 100) {
        $('.scrolltop').fadeIn('fast');
    } else {
        $('.scrolltop').fadeOut('fast');
    }
});