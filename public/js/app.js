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
    
    /* function to convert canvas urlData output to blob */
    function dataURLtoBlob(dataURL) {
        var binary = atob(dataURL.split(',')[1]);
        var array = [];
        for(var i = 0; i < binary.length; i++) {
            array.push(binary.charCodeAt(i));
        }
        return new Blob([new Uint8Array(array)], {type: 'image/jpeg'});
    }

    var activeEdit = false;

    return {
        zclip: false,
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
            var blobImageData = dataURLtoBlob(app.canvas.toDataURL()),
                formData = new FormData();
            
            formData.append('image', blobImageData);   
            formData.append('picId', app.getPicId());  
                
            var afterUpload = function(resp) {
                if(resp && resp.picId) {
                    var link = window.location.origin + '/' + resp.picId;
                    $('.link-input').val(link); 
                    if(app.zclip) app.zclip.setText(link);
                }
            };
            app.upload(formData, afterUpload);
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
            app.setPicProps({width: $pic.width(), height: $pic.height()});

            var $c = $('<canvas>').attr('id', 'cnvs');
            var bw = $('body').width(),
                pw = $pic.width(),
                ph = $pic.height();
                    
            $c.width(pw);
            $c.height(ph);
            $c.attr('width', pw);
            $c.attr('height', ph);
            $('#content #pic-holder').prepend($c);

            app.canvas = new fabric.Canvas('cnvs');
            app.canvas.setBackgroundImage($pic.attr('src'), app.canvas.renderAll.bind(app.canvas), {
               backgroundImageStretch: false
            });
            app.canvas.selection = false;
            
            var d = bw-pw;
            if(d) {
                $('.canvas-container').css('margin-left', d/2);
                app.canvas.calcOffset();
            }
            
            canvasInitialized = true;
            console.log('Canvas initialized successfuly');
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
            
        var afterUpload = function(resp) {
            if(resp && resp.picId) {
                var $img = $('#pic-holder img');
                $img.attr('src', '/uploads/' + resp.picId  + '.png');
                app.setPicId(resp.picId);
                app.initCanvas(function(){$img.removeClass('loading');});
                // history.pushState({}, data.picId, "/" + data.picId);
                // $('.link-input').val(data.picLink)
                // window.location = '/' + data.imgId;
            }
        };

        reader.onload = function(evt){
            var picSrc = evt.target.result;
            var $pic = $('#pic-holder img');
            if(!$pic.length) $pic = $('<img />');
            
            $pic.attr('src', picSrc);
            $pic.addClass('loading');

            $picHolder.find('.tip').hide();
            $picHolder.append($pic);
            
            /* try to upload image to server */
            $pic.load(function(event){
                /* recalculate picture width if it fullscreen*/
                var pw = $pic.width();
                var d = $('body').width() - pw;
                if(d < 40) {
                    pw = pw - (40 - d);
                    $pic.width(pw);
                }
                app.upload(formData, afterUpload);
                $(this).off(event);
            }) 
            
        };

        reader.readAsDataURL(blob);
        formData.append('image', blob);
        
    };
    
    /* Binding events */
    document.onpaste = pasteHandler;
    
    /* clipboard copy plugin initialization */
    ZeroClipboard.setDefaults( { moviePath: '/js/ZeroClipboard.swf' } );
    app.zclip = new ZeroClipboard();
        
});

