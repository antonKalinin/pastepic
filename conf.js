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
    console.log(process.env);
    console.log(env);
    console.log(config[env]);
    if(env && config[env]) {
        module.exports = config[env];
    } else {
        module.exports = config.development;
    }


})();