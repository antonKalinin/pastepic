$(function() {
    /* Bind paste event */
    document.onpaste = function(event){
        var items = event.clipboardData.items;

        /* Detect if last item is image */
        var type = items[0].type;
        var isImage = (type.match(/^image/ig)).length > 0;
        if (isImage) {
            var blob = items[0].getAsFile();
            var reader = new FileReader();
            reader.onload = function(event){
                var imgSrc = event.target.result;
                console.log(imgSrc);
                var $img = $('<img />').attr('src', imgSrc);
                $('.image-holder').append($img);
            };
            reader.readAsDataURL(blob);
        }
    }
});