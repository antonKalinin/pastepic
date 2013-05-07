/* Global client application module */
var app = (function(){
    var pic = {
        id: false,
        width: 0,
        height: 0
    };

    var canvasInitialized = false;

    return {
        getPicId: function() {
            return pic.id;
        },
        setPicId: function(picId) {
            pic.id = picId;
        },
        setPicProps: function(props) {
            for (p in props) {
                if (pic.hasOwnProperty(p)) {
                    pic[p] = props[p];
                }
            }
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
        },
        /**
         * Initialize canvas over the pasted picture.
         */
        initCanvas: function() {
            if(canvasInitialized) return true;

            var $pic = $('img.pasted');
            app.setPicProps({width: $pic.width(), height: $pic.height()});
            if(screen.width - $pic.width() < 20) {
                $pic.css('width', $pic.width()-20);
            }

            var $c = $('<canvas>').attr('id', 'cnvs');
            var t = $pic.width();
            $c.width(t);
            $c.height($pic.height());
            $c.attr('width', t);
            $c.attr('height', $pic.height());
            $('#content #pic-holder').prepend($c);

            app.canvas = new fabric.Canvas('cnvs', {
                isDrawingMode: true,
                freeDrawingColor: '#09c',
                freeDrawingLineWidth: 3,
            });
            
            app.canvas.setBackgroundImage($pic.attr('src'), app.canvas.renderAll.bind(app.canvas));
            $pic.hide();

            var d = screen.width - $pic.width();
            if(d) {
                $('.canvas-container').css('margin-left', d/2);
                app.canvas.calcOffset();
            }
            canvasInitialized = true;
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
            var picSrc = evt.target.result;

            var $pic = $('img.pasted');
            if(!$pic.length) {
                $pic = $('<img />')
            }
            $pic.attr('src', picSrc);
            $pic.addClass('pasted').addClass('loading');

            $picHolder.find('.tip').hide();
            $picHolder.append($pic);
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
                    app.initCanvas();
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

