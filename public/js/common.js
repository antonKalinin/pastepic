$(function() {
    /* Bind paste event */
    function pasteHandler(event){
        var items = event.clipboardData.items;
        if (!items.length) {
            console.log("Nothing to paste.");
            return false;
        }

        /* Get only first item of clipboard (last inserted) */
        var item = items[0],
            type = item.type;

        /* Detect if item is image */
        if (!type.match(/^image/ig)) {
            return false;
        }

        
        var formData = new FormData(),
            reader = new FileReader(),
            blob = item.getAsFile();
            
        reader.onload = function(event){
            var imgSrc = event.target.result;

            var $img = $('.image-holder img');
            if(!$img.length) {
                $img = $('<img />')
            }
            $img.attr('src', imgSrc);
            $('.image-holder .content-tip').hide();
            $('.image-holder').append($img);
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
                    window.location = '/' + data.imgId;
                }
            },
            dataType: 'json'
        });
    };
    
    document.onpaste = pasteHandler;
});
