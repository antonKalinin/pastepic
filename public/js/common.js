$(function() {
    /* Bind paste event */
    function pasteHandler(event){
        var items = event.clipboardData.items;

        /* Get only first item of clipboard (last inserted) */
        var item = items[0];
        var type = item.type;
        
        /* Detect if item is image */
        var isImage = (type.match(/^image/ig)).length > 0;
        if (!isImage) {
            return false;
        }
        
        var formData = new FormData(),
            reader = new FileReader(),
            blob = item.getAsFile();
            
        reader.onload = function(event){
            var imgSrc = event.target.result;
            console.log(imgSrc);
            var $img = $('<img />').attr('src', imgSrc);
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
                console.log('data');    
            },
            dataType: 'json'
        });
    };
    
    document.onpaste = pasteHandler;
});
