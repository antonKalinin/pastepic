exports.home = function(req, res) {
    res.render('home', {title: 'Pic.Talk'})
};

exports.uploadHandler = function(req, res) {
    console.log('Upload started...');
    // res.send(req);
};
