var mongoose = require('mongoose');

var browsers = {
    'Chrome':  0,
    'Firefox': 1,
    'Safari':  2,
    'Opera':   3,
    'IE':      4,
    'Other':   5
};

var os = {
    'Windows': 0,
    'Mac OS X': 1,
    'Linux': 3,
    'Other': 4
};

var insertSchema = new mongoose.Schema({
    ts: { type : Date, default: new Date().getTime() },
    ip: Array,
    os: Number,
    browser: Number
}, {collection: 'inserts'});

insertSchema.set('autoIndex', false);

insertSchema.methods = {
    getOs: function() {

    },
    getBrowser: function() {
        for (var b in browsers) {
            if (this.browser == browsers[b]) {
                return b;
            }
        }
    }
};

insertSchema.statics = {
    getBrowserId: function(family) {
        if (browsers[family]) {
            return browsers[family];
        } else {
            return browsers['Other'];
        }
    },
    getOsId: function(os) {
        return 1;
    }
}

// middleware
/*picSchema.pre('save', function(next) {
    console.log("Pre save!");
    console.log(this);
    return next();
});*/

exports.Insert = mongoose.model('insert', insertSchema);


