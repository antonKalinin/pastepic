/* self calling function that return a config object depends on NODE_ENV variable */

(function(){

    var config = {
        common: {
            storeDir: 'imgstore',
            storePath: '/public/imgstore/', // images uploads folder
            prStorePath: '/public/imgpstore/' // images previews folder
        },
        production: {
            production: true,
            port: 8030,
            domain: 'http://pastepic.me'
        },
        development: {
            production: false,
            port: 8080,
            domain: 'localhost'
        }
    };

    var env = process.env.NODE_ENV,
        envConfig = {};
    if (env && config[env]) {
        envConfig = config[env];
    } else {
        envConfig = config.development;
    }

    for (var prop in envConfig) {
        config.common[prop] = envConfig[prop];
    }

    module.exports = config.common;

})();
