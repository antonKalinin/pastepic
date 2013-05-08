/* Global client application module */
var app = (function(){
    var pic = {
        id: false,
        width: 0,
        height: 0
    };

    var canvasInitialized = false,
        editMode = false;

    var edit = {
        pencil: function(on) {
            if(on) {
                app.canvas.isDrawingMode = true;
                app.canvas.freeDrawingColor = '#09c';
                app.canvas.freeDrawingLineWidth = 4;
            } else {
                app.canvas.isDrawingMode = false;
            }
        }
    };

    var activeEdit = false;


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
        makeLink: function() {
            var imgData = app.canvas.toDataURL();
            console.log(imgData);
            $('.link-input').val(pic.id);
        },
        unblockContols: function() {
            $('.controls-blocker').hide();
        },
        /**
         * Initialize canvas over the pasted picture.
         */
        initCanvas: function(fn) {
            if(canvasInitialized) return true;

            var $pic = $('#pic-holder img');
            console.log($pic);
            app.setPicProps({width: $pic.width(), height: $pic.height()});

            var $c = $('<canvas>').attr('id', 'cnvs');
            var w = $pic.width(), h = $pic.height();
            $c.width(w);
            $c.height(h);
            $c.attr('width', w);
            $c.attr('height', h);
            $('#content #pic-holder').prepend($c);

            app.canvas = new fabric.Canvas('cnvs');
            app.canvas.setBackgroundImage($pic.attr('src'), app.canvas.renderAll.bind(app.canvas), {
               backgroundImageStretch: false
            });

            var d = $('body').width() - $pic.width();
            if(d) {
                $('.canvas-container').css('margin-left', d/2);
                app.canvas.calcOffset();
            }
            canvasInitialized = true;
            app.unblockContols();
            if(fn) fn();
        },
        picEdit: function(tool, el) {
            if(activeEdit) activeEdit(false);
            $('.edit-block .btn').removeClass('active');
            if(edit.hasOwnProperty(tool)) {
                activeEdit = edit[tool];
                edit[tool](true);
            }
            $(el).addClass('active');
        },
        toggleEditMode: function() {
            if(!editMode) {
                app.initCanvas();
                $('#pic-holder img').hide();
            } else {
                
            }
        },
        upload: function(data, fn) {
            $.ajax({
                type: "POST",
                url: '/upload',
                data: data,
                cache: false,
                contentType: false,
                processData: false,
                success: function (resp) {
                    if(fn) fn(resp);
                },
                dataType: 'json'
            });
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
            $pic.addClass('loading');

            $picHolder.find('.tip').hide();
            $picHolder.append($pic);
        };

        reader.readAsDataURL(blob);
        formData.append('image', blob);
        
        var afterUpload = function(resp) {
            if(resp && resp.picId) {
                var $img = $('img.pasted');
                $img.attr('src', '/uploads/' + resp.picId  + '.png');
                app.setPicId(resp.picId);
                app.initCanvas(function(){$img.removeClass('loading');});
                // history.pushState({}, data.picId, "/" + data.picId);
                // $('.link-input').val(data.picLink)
                // window.location = '/' + data.imgId;
            }
        }
        
        /* try to upload image to server */
        app.upload(formData, afterUpload);
    };
    
    /* Binding events */
    document.onpaste = pasteHandler;
    //$picHolder.bind('mousewheel', zoomHandler);
    
    $('img.pasted').dblclick(function(){
        $('a.fullscreen-pic')[0].click();    
    });
    
    //$(document).bind('paste', pasteHandler);
});

