/**
 * Global client application module
 **/
var app = (function() {

    var canvas = null,
        canvasInitialized = false,
        imageObject = null;

    var mouse = {x: 0, y: 0};

    var crop = (function() {
        var enabled = false,
            inAction = false,
            cPos = [],
            rect = null;

        var $cd = null; // crop dialog element


        var listeners = {
            mouseDown: function (event) {
                if (!enabled) return;
                hideCropDialog();
                rect.left = event.e.pageX - cPos[0];
                rect.top = event.e.pageY - cPos[1];
                rect.visible = true;
                mouse.x = event.e.pageX;
                mouse.y = event.e.pageY;
                inAction = true;
            },
            mouseMove: function (event) {
                if (enabled && inAction) {
                    if (event.e.pageX - mouse.x > 0) {
                        rect.width = event.e.pageX - mouse.x;
                    }

                    if (event.e.pageY - mouse.y > 0) {
                        rect.height = event.e.pageY - mouse.y;
                    }
                    canvas.bringToFront(rect);
                }
            },
            mouseUp: function () {
                inAction = false;
                showCropDialog(rect.left + cPos[0], rect.top + cPos[1]);
            }
        };

         var showCropDialog = function(x, y) {
                 var dialogH = 30;
                 if (!$cd) {
                     $cd = $('#crop-dialog');
                 }
                 $cd.css('left', x);
                 $cd.css('top', y - dialogH);
                 $cd.removeClass('hidden');
             },
             hideCropDialog = function() {
                 if (!$cd) return;
                $cd.addClass('hidden');
             };

        return {
            enable: function(btnEl) {
                if (!canvasInitialized) return;
                if (enabled) {
                    crop.disable();
                    return;
                }
                canvas.selectable = true;
                var canvasR = document.getElementById('cnvs').getBoundingClientRect();
                cPos[0] = canvasR.left;
                cPos[1] = canvasR.top;
                rect = new fabric.Rect({
                    fill: 'transparent',
                    originX: 'left',
                    originY: 'top',
                    stroke: '#ddd',
                    strokeDashArray: [2, 2],
                    strokeWidth: 2,
                    opacity: 1,
                    width: 1,
                    height: 1
                });
                rect.visible = false;
                canvas.add(rect);
                enabled = true;
                this.bindListeners();
                $(btnEl).removeClass('btn-info');
                $(btnEl).addClass('btn-warning');
            },
            disable: function() {
                enabled = false;
                canvas.remove(rect);
                hideCropDialog();
                this.unbindListeners();

                var $cropBtn = $('#btn-toggle-crop');
                $cropBtn.addClass('btn-info');
                $cropBtn.removeClass('btn-warning');
            },
            do: function() {
                var left = rect.left - imageObject.left,
                    top = rect.top - imageObject.top,
                    width = rect.width,
                    height = rect.height;

                imageObject.clipTo = function (ctx) {
                    ctx.rect(left, top, width, height);
                };
                canvas.renderAll();
                this.disable();
            },
            bindListeners: function() {
                canvas.on("mouse:down", listeners.mouseDown);
                canvas.on("mouse:move", listeners.mouseMove);
                canvas.on("mouse:up", listeners.mouseUp);
            },
            unbindListeners: function() {
                var canvasEl = $('.upper-canvas')[0];
                // todo: fix it
                fabric.util.removeListener(canvasEl, "mouse:down", listeners.mouseDown);
                fabric.util.removeListener(canvasEl, "mouse:move", listeners.mouseMove);
                fabric.util.removeListener(canvasEl, "mouse:up", listeners.mouseUp);

            }
        };
    })();

    /* function to convert canvas urlData output to blob */
    function dataURLtoBlob(dataURL) {
        var binary = atob(dataURL.split(',')[1]);
        var array = [];
        for(var i = 0; i < binary.length; i++) {
            array.push(binary.charCodeAt(i));
        }
        return new Blob([new Uint8Array(array)], {type: 'image/jpeg'});
    }

    return {
        zclip: null,
        crop: crop,
        /**
         * Initialize canvas over the pasted picture.
         */
        initCanvas: function(w, h, fn) {
            if(canvasInitialized) return true;

            var $canvas = $('<canvas>').attr('id', 'cnvs');

            $canvas.width(w);
            $canvas.height(h);
            $canvas.attr('width', w);
            $canvas.attr('height', h);
            $('#content #pic-holder').prepend($canvas);

            canvas = new fabric.Canvas('cnvs');
            canvas.selection = false;

            // aligning canvas to the center of the screen
            var dw = document.width - w,
                dh = (document.height - 30) - h; // 30px for top nav


            if (dw) {
                $('.canvas-container').css('margin-left', dw/2);
                canvas.calcOffset();
            }

            if (dh) {
                //$('.canvas-container').css('margin-top', dh/2);
                //canvas.calcOffset();
            }

            canvasInitialized = true;
            console.log('Canvas initialized successfuly');
            if (fn) fn();
        },
        addImgToCanvas: function(picSrc, width, height, fn) {
            fabric.util.loadImage(picSrc, function (img) {
                imageObject = new fabric.Image(img, {
                    left: width/2,
                    top: height/2,
                    selectable: false
                });

                canvas.add(imageObject);
                if (fn) fn();
            });
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


app.pic = (function(){

    var id,
        link,
        width,
        height;

    return {
        getId: function() {
            return id;
        },
        setId: function(picId) {
            id = picId;
        },
        getLink: function() {
            return link;
        },
        setLink: function(l) {
            link = l;
        },
        setWidth: function(w) {
            width = w;
        },
        setHeight: function(h) {
            height = h;
        }
    }
})();

/*
  This is javascript to handle all the events of image manipulating
*/

function pasteHandler(evt){
    var $picHolder = $('#content #pic-holder');

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
        imageBlob = item.getAsFile();

    var afterUpload = function(resp) {
        if (resp && resp.picId) {
            var $img = $('#pic-holder img'),
                picSrc = '/uploads/' + resp.picId  + '.png';
            $img.attr('src', picSrc);

            var w = resp.picParams.width,
                h = resp.picParams.height;

            app.pic.setId(resp.picId);
            app.pic.setLink(resp.picLink);
            app.pic.setWidth(w);
            app.pic.setHeight(h);

            app.initCanvas(w, h);

            app.addImgToCanvas(picSrc, w, h, function(){
                $img.removeClass('loading');
                $img.hide();
            });

            history.pushState({}, resp.picId, "/" + resp.picId);
            $('#link-form').show();
            $('.pic-link').val(resp.picLink);
            $('.copy-link-tip').fadeIn(300);

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

        formData.append('imageBlob', imageBlob);

        /* try to upload image to server */
        $pic.load(function(event){
            app.upload(formData, afterUpload);
            $(this).off(event);
        })

    };

    reader.readAsDataURL(imageBlob);
};


$(function() {
    /* clipboard copy plugin initialization */
    app.zclip = new ZeroClipboard($('#btn-copy-link'), { moviePath: '/js/ZeroClipboard.swf' });
    app.zclip.on('load', function (client) {
        console.log('Coppy plugin flash movie loaded and ready.');
    });

    app.zclip.on('mousedown', function(){
        app.zclip.setText(app.pic.getLink());
    });

    app.zclip.on( 'complete', function(client, args) {
        UI.notify("Copied to clipboard!");
    });
});

