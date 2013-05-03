/* Global client application module */
var app = (function(){
    var _picId = false;
    return {
        getPicId: function() {
            return _picId;
        },
        setPicId: function(picId) {
            _picId = picId;
        },
        linkToClipboard: function() {
            if (window.clipboardData && clipboardData.setData) {
                UI.notify('Copied to clipboard.');
                clipboardData.setData('location', window.location);
            } else {
                var _defaults = {
                    moviePath:         "ZeroClipboard.swf",        // URL to movie
                    trustedDomains:    undefined,                  // Domains that we should trust (single string or array of strings)
                    hoverClass:        "zeroclipboard-is-hover",   // The class used to hover over the object
                    activeClass:       "zeroclipboard-is-active",  // The class used to set object active
                    allowScriptAccess: "sameDomain",               // SWF outbound scripting policy
                    useNoCache:        true                        // Include a nocache query parameter on requests for the SWF
                };
                var clip = new ZeroClipboard(_defaults);
                clip.setText( 'Copy me!' );
            }
        }
    };
})();   


/*
  This is javascript to handle all the events of image manipulating
*/

$(function() {
    var $picHolder = $('#content #pic-holder');
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
            $picHolder.find('.tip').hide();
            $picHolder.append($img);
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
                if(data && data.picId) {
                    var $img = $('img.pasted');
                    $img.attr('src', '/uploads/' + data.picId  + '.png');
                    $img.removeClass('loading');
                    history.pushState({}, data.picId, "/" + data.picId);
                    $('.link-input').val(data.picLink)
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
            contentSlideRight = parseInt($picHolder.css('margin-left'));

        if(width <= 600 && zoomFactor < 0) return false;
        if(width >= 1200 && zoomFactor > 0) return false;

        /*if(width > 1200 && zoomFactor > 0) {
            if(contentSlideRight > 0) {
                contentSlideRight -= zoomStep;
                $picHolder.css('margin-left', contentSlideRight)
            }
        }*/

        /*if(width < 1200 && zoomFactor < 0) {
            $picHolder.addClass('slided');
        }*/

        width += (zoomFactor*zoomStep);
        $logger.text(width);
        $img.css('width', width);
    }
    
    /* Binding events */
    document.onpaste = pasteHandler;
    //$picHolder.bind('mousewheel', zoomHandler);
    
    $('img.pasted').dblclick(function(){
        $('a.fullscreen-pic')[0].click();    
    });
    
    //$(document).bind('paste', pasteHandler);
});

