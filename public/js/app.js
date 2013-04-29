/* Global client application module */
var app = (function(){
    var _picId = false;
    return {
        getPicId: function() {
            return _picId;
        },
        setPicId: function(picId) {
            _picId = picId;
        }
    };
})();    


/*
  This is javascript to handle all the events of image manipulating
*/

$(function() {
    var $content = $('#content-container');
    function pasteHandler(evt){
        var items = evt.clipboardData.items;
        if (!items.length) {
            console.log("Nothing to paste.");
            return false;
        }

        /* Get only first item of clipboard (last inserted) */
        var item = items[0],
            type = item.type;

        /* Detect if item is image */
        if (!type.match(/^image/ig)) {
            UI.notify('Houston, we need an image!');      
            return false;
        }

        
        var formData = new FormData(),
            reader = new FileReader(),
            blob = item.getAsFile();
            
        reader.onload = function(evt){
            var imgSrc = evt.target.result;

            var $img = $('img.pasted');
            if(!$img.length) {
                $img = $('<img />')
            }
            $img.attr('src', imgSrc);
            $img.addClass('pasted').addClass('loading');
            $content.find('.content-tip').hide();
            $content.append($img);
        };

        reader.readAsDataURL(blob);
        
        /* try to upload image to server */
        formData.append('image', blob);
        $.ajax({
            type: "POST",
            url: '/upload',
            data: formData,
            cache: false,
            contentType: false,
            processData: false,
            success: function (data) {
                if(data && data.imgId) {
                    var $img = $('img.pasted');
                    $img.attr('src', '/uploads/' + data.imgId  + '.png');
                    $img.removeClass('loading');
                    history.pushState({}, data.imgId, "/" + data.imgId);
                    // window.location = '/' + data.imgId;
                }
            },
            dataType: 'json'
        });
    };

    function zoomHandler(evt) {
        var $logger = $('#logger');
        var zoomFactor = (evt.originalEvent.wheelDelta > 0) ? 1 : -1,
            zoomStep = 50;
        var $img = $('img.pasted'),
            width = parseInt($img.css('width')),
            contentSlideRight = parseInt($content.css('margin-left'));

        if(width <= 600 && zoomFactor < 0) return false;
        if(width >= 1200 && zoomFactor > 0) return false;

        /*if(width > 1200 && zoomFactor > 0) {
            if(contentSlideRight > 0) {
                contentSlideRight -= zoomStep;
                $content.css('margin-left', contentSlideRight)
            }
        }*/

        /*if(width < 1200 && zoomFactor < 0) {
            $content.addClass('slided');
        }*/

        width += (zoomFactor*zoomStep);
        $logger.text(width);
        $img.css('width', width);
    }
    
    /* Binding evts */
    document.onpaste = pasteHandler;
    $content.bind('mousewheel', zoomHandler);
    //$(document).bind('paste', pasteHandler);
});

