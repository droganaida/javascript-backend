
//================================================================//
//*********** login.js
//*********** © Aida Drogan - #BlondieCode
//*********** Описание поведения формы логина (страница login.html)
//*********** Проверка полей формы логина на валидность
//*********** ajax-запрос на авторизацию
//================================================================//

$(document).ready(function(){

    var errorTopMargin = 50;

    //---------------------------- фильтры для проверки полей на недопустимые символы
    //---------------------------- https://www.sitepoint.com/expressions-javascript/
    var filterUsername  = /^([a-zA-Z0-9_\-])+$/;
    var filterPassword = /^[a-zA-Z0-9!%&@#$\^*?_~+]+$/;

    $('#pass').on('keyup', function(e){
        //---------------------------- если пользователь нажал enter
        if (e.keyCode == 13){
            $('.b-login').click();
        }
    });

    //=========================== Кнопка войти ==========================//

    $('.b-login').on("click", function(){

        //---------------------------- параметры для авторизации
        var data = {};
        data.username = $('#username').val();
        data.password = $('#pass').val();

        if (data.username == ''){
            //-------------------- showError(text, top) функция для отображения ошибки
            //-------------------- text - текст сообщения
            //-------------------- top - отступ от верха страницы
            showError('Пожалуйста введите свое имя!', errorTopMargin);
        } else if (data.password == ''){
            showError('Пожалуйста введите свой пароль!', errorTopMargin);
        } else if (!filterUsername.test(data.username)){
            showError('Недопустимые символы в имени', errorTopMargin);
        } else if(!filterPassword.test(data.password)) {
            showError('Недопустимые символы в пароле', errorTopMargin);
        } else {

            //------------ { ДОПИСАНО БЭКЭНД-ДЕВЕЛОПЕРОМ
            $.ajax({
                url: '/login',
                type: 'POST',
                dataType: 'json',
                data: data,
                error: function(){
                    showError('Неверное имя или пароль!', errorTopMargin);
                }
            }).done(function(data){

                if (data.link){
                    window.location.href = data.link;
                } else {
                    showError('Неверное имя или пароль!', errorTopMargin);
                }

            })
        }
        //------------ }
    })
});