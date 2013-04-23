exports.home = function(req, res) {
    res.render('home', {title: 'Pic.Talk'})
};

exports.uploadHandler = function(req, res) {
    console.log('Upload started...');
    console.log(req);
    res.send('ok');
};
