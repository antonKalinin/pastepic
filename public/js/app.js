/**
 * Global client application module
 **/
var app = (function(){
    var canvas = {el: null, obj: null, initialized: false};
    var pic = {
        id: false,
        link: '',
        width: 0,
        height: 0
    };
    var mouse = {x: 0, y: 0};
    var crop = {
        enabled: false,
        inAction: false,
        cPos: [],
        rect: null,
        enable: function() {
            if (!canvas.initialized) return;
            canvas.obj.selectable = true;
            var canvasR = canvas.el[0].getBoundingClientRect();
            this.cPos[0] = canvasR.left;
            this.cPos[1] = canvasR.top;
            this.rect = new fabric.Rect({
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
            this.rect.visible = false;
            canvas.obj.add(this.rect);
            this.enabled = true;
            this.bindListeners();
        },
        disable: function() {
            this.enabled = false;
            this.unbindListeners();
        },
        do: function() {
            var left = el.left - object.left;
            var top = el.top - object.top;

            left *= 1 / 0.25;
            top *= 1 / 0.25 ;

            var width = el.width * 1 / 0.25;
            var height = el.height * 1 / 0.25;

            object.clipTo = function (ctx) {
                ctx.rect(left, top, width, height);
            };
            object.selectable = true;
            disabled = true;
            el.visible = false;
            canvas.obj.renderAll();
        },
        bindListeners: function() {
            var self = this;
            canvas.obj.on("mouse:down", function (event) {
                if (!self.enabled) return;
                self.rect.left = event.e.pageX - self.cPos[0];
                self.rect.top = event.e.pageY - self.cPos[1];
                self.rect.visible = true;
                mouse.x = event.e.pageX;
                mouse.y = event.e.pageY;
                self.inAction = true;
                //canvas.obj.bringToFront(self.rect);
            });
            canvas.obj.on("mouse:move", function (event) {
                if (self.enabled && self.inAction) {
                    if (event.e.pageX - mouse.x > 0) {
                        self.rect.width = event.e.pageX - mouse.x;
                    }

                    if (event.e.pageY - mouse.y > 0) {
                        self.rect.height = event.e.pageY - mouse.y;
                    }
                    canvas.obj.bringToFront(self.rect);
                }
            });
            canvas.obj.on("mouse:up", function () {
                self.inAction = false;
            });
        },
        unbindListeners: function() {

        }
    };

    var editMode = false;

    var edit = {
        pencil: function(on) {
            if(on) {
                canvas.obj.isDrawingMode = true;
                canvas.obj.freeDrawingColor = '#09c';
                canvas.obj.freeDrawingLineWidth = 4;
            } else {
                canvas.obj.isDrawingMode = false;
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
        getPicLink: function() {
            return pic.link;
        },
        setPicLink: function(picLink) {
            pic.link = picLink;
        },
        setPicProps: function(props) {
            for (p in props) {
                if (pic.hasOwnProperty(p)) {
                    pic[p] = props[p];
                }
            }
        },
        makeLink: function() {
            var blobImageData = dataURLtoBlob(canvas.obj.toDataURL()),
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
        /**
         * Initialize canvas over the pasted picture.
         */
        initCanvas: function(w, h, src, fn) {
            if(canvas.initialized) return true;

            canvas.el = $('<canvas>').attr('id', 'cnvs');
            var bw = $('body').width();

            canvas.el.width(w);
            canvas.el.height(h);
            canvas.el.attr('width', w);
            canvas.el.attr('height', h);
            $('#content #pic-holder').prepend(canvas.el);

            canvas.obj = new fabric.Canvas('cnvs');
            if (src) {
                canvas.obj.setBackgroundImage(src, canvas.obj.renderAll.bind(canvas.obj), {
                    backgroundImageStretch: false
                });
            }

            canvas.obj.selection = false;

            var d = bw-w;
            if (d) {
                $('.canvas-container').css('margin-left', d/2);
                canvas.obj.calcOffset();
            }

            canvas.initialized = true;
            console.log('Canvas initialized successfuly');
            if (fn) fn();
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
        enableCrop: function(el) {
            $(el).removeClass('btn-info');
            $(el).addClass('btn-warning');
            crop.enable();
        },
        doCrop: function() {
            crop.do();
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
            imageBlob = item.getAsFile();

        var afterUpload = function(resp) {
            if(resp && resp.picId) {
                var $img = $('#pic-holder img'),
                    picSrc = '/uploads/' + resp.picId  + '.png';
                $img.attr('src', picSrc);
                app.setPicId(resp.picId);
                app.setPicLink(resp.picLink);
                app.setPicProps({width: resp.picParams.width, height: resp.picParams.height});
                app.initCanvas(resp.picParams.width, resp.picParams.height, picSrc,
                    function(){
                        $img.removeClass('loading');
                        $img.hide();
                    }
                );
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

    /* Binding events */
    document.onpaste = pasteHandler;
    
    
    $(function(){
        /* clipboard copy plugin initialization */
        app.zclip = new ZeroClipboard($('#btn-copy-link'), { moviePath: '/js/ZeroClipboard.swf' });
        app.zclip.on('load', function (client) {
            console.log('Coppy plugin flash movie loaded and ready.');
        });

        app.zclip.on('mousedown', function(){
            app.zclip.setText(app.getPicLink());
        });

        app.zclip.on( 'complete', function(client, args) {
            UI.notify("Copied to clipboard!");
        } );


    });
    
        
});

