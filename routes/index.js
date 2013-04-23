exports.home = function(req, res) {
    res.render('home', {title: 'Pic.Talk'})
};

exports.uploadHandler = function(req, res) {
    res.send(req);
};
