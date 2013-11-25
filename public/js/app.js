/**
 * Global client application module
 **/
var app = (function() {

    var canvas = null,
        canvasInitialized = false,
        imageObject = null;

    var mouse = {x: 0, y: 0};

    var pic = (function(){
        var id,
            link,
            width,
            height,
            tone;

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
            },
            getTone: function() {
                return tone;
            },
            setTone: function(t) {
                tone = t;
            }
        }
    })();

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
                    canvas.upperCanvasEl.style.cursor = 'pointer';
                    canvas.lowerCanvasEl.style.cursor = 'pointer';
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
                var picTone = pic.getTone(),
                    inverseTone = [];

                for (var i = 0; i < 3; i++) { inverseTone.push(255-picTone[i]) }
                var strokeColor = 'rgb(' + inverseTone.join(',') +')';
                rect = new fabric.Rect({
                    fill: 'transparent',
                    originX: 'left',
                    originY: 'top',
                    stroke: strokeColor,
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
                var r = {
                    picId: app.pic.getId(),
                    left: rect.left,
                    top: rect.top,
                    width: rect.width,
                    height: rect.height
                    },
                    cLeft = rect.left - imageObject.left,
                    cTop = rect.top - imageObject.top;

                imageObject.clipTo = function (ctx) {
                    ctx.rect(cLeft, cTop, r.width, r.height);
                };
                canvas.renderAll();

                // success = updateCanvas(resp)
                $.post('/crop', r, function(resp){
                    console.log(resp);
                });

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

    var showTools = function() {
            $('.edit-tools').removeClass('hidden');
        },
        hideTools = function() {
            $('.edit-tools').addClass('hidden');
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

    return {
        zclip: null,
        crop: crop,
        pic: pic,
        setStatus: function(status) {
            $('#status').html(status);
        },
        clearStatus: function() {
            $('#status').html('');
        },
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
            app.canvas = canvas; // debug only
            showTools();
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
                    console.log(resp);
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

    app.setStatus('Uploading the picture...');

    var formData = new FormData(),
        reader = new FileReader(),
        imageBlob = item.getAsFile();

    var afterUpload = function(pic) {
        if (!pic) return false;

        var $img = $('#pic-holder img');
        $img.attr('src', pic.src);

        var w = pic.size.width,
            h = pic.size.height;

        //TODO: Set all pic object at once
        app.pic.setId(pic.id);
        app.pic.setLink(pic.link);
        app.pic.setWidth(w);
        app.pic.setHeight(h);
        app.pic.setTone(pic.tone);

        app.initCanvas(w, h);

        app.addImgToCanvas(pic.src, w, h, function(){
            $img.removeClass('loading');
            $img.hide();
        });

        history.pushState({}, pic.id, "/" + pic.id);
        app.clearStatus();
        $('#link-form').show();
        $('.pic-link').val(pic.link);
        $('.copy-link-tip').fadeIn(300);

    };

    reader.onload = function(evt){
        var picSrc = evt.target.result;
        var $pic = $('#pic-holder img'),
            $picWrap = $('<div></div>').addClass('pic-wrap');

        if(!$pic.length) $pic = $('<img />');

        $pic.attr('src', picSrc);
        $pic.addClass('loading');

        $picHolder.find('.tip').hide();
        $picWrap.append($pic);
        $picHolder.append($picWrap);

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

