/* self calling function that return a config object depends on NODE_ENV variable */
(function(){

    var config = {
        production: {
            port: 8000,
            domain: 'http://pastepic.me'
        },
        development: {
            port: 8080,
            domain: 'localhost'
        }
    };

    var env = process.env.NODE_ENV;
    if(env && config[env]) {
        module.exports = config[env];
    } else {
        module.exports = config.development;
    }

})();
