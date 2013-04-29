/* self calling function that return a config object depends on NODE_ENV variable */
(function(){

    var config = {
        production: {
            port: 80,
            domen: 'http://fronteeth.com'
        },
        development: {
            port: 8080,
            domen: 'localhost/'
        }
    };

    var env = process.env.NODE_ENV;
    if(env && config[env]) {
        module.exports = config[env];
    }

    module.exports = config.development;

})();