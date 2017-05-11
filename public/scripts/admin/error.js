
//================================================================//
//*********** error.js
//*********** © Aida Drogan - #BlondieCode
//*********** Функционал окна с сообщением об ошибке (<div class="error-holder">)
//*********** Присутствует на всех страницах админ-панели
//=========== ВЫЗОВ
//*********** showError(text, top) - сообщеие об ошибке
//*********** showSuccess(text, top) - сообщеие об успешном завершении
//=========== ПАРАМЕТРЫ
//*********** text - сообщение в окне
//*********** top - отступ от верха страницы (px)
//================================================================//

//==============================================================//
//*********** hideError - скрыть сообщение об ошибке ***********//
//==============================================================//

var timer = null;

function hideError(){

    //------------ очищаем таймер
    if (timer != null){
        window.clearTimeout(timer);
    }

    //------------ таймаут на 5 секунд
    timer = window.setTimeout(function(){
        $('.error-holder').fadeOut();
    }, 5000);
}

//---------- если success, то форма имеет класс error-holder-success
function showPopup(text, top, success) {

    if (success) {
        $('.error-holder').addClass('error-holder-success');
    } else {
        $('.error-holder').removeClass('error-holder-success');
    }
    $('.error-holder').css({"top":"" + top + "px", "z-index":"999999"});
    $('.error-holder span').text(text);

    $('.error-holder').fadeIn(function(){
        hideError();
    });
}

//==============================================================//
//********** showError - показать сообщение об ошибке **********//
//==============================================================//
function showError(text, top){

    showPopup(text, top, false);
}

//==============================================================//
//******* showSuccess - сообщение об успешном завершении *******//
//==============================================================//
function showSuccess(text, top){

    showPopup(text, top, true);
}

$(document).ready(function(){

    //=============== Скрыть сообщение по клику =================//
    $('.error-holder').on("click", function(){
        $(this).fadeOut();
    });

});