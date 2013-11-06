var mongoose = require('mongoose');

var ua = {
    'Chrome':  0,
    'Firefox': 1,
    'Safari':  2,
    'Opera':   3,
    'IE':      4,
    'Other':   5
};

var os = {
    'Windows 7': 0,
    'Mac OS X': 1,
    'Linux': 3,
    'Other': 4
};

var insertSchema = new mongoose.Schema({
    ts: { type : Date, default: Date.now },
    ip: Array,
    os: Number,
    browser: Number
}, {collection: 'inserts'});

insertSchema.set('autoIndex', false);

insertSchema.methods = {
    getDate: function() {
        return this.ts.toLocaleString();
    },
    getOs: function() {
        for (var k in os) {
            if (this.os == os[k]) {
                return b;
            }
        }
    },
    getBrowser: function() {
        for (var k in ua) {
            if (this.browser == ua[k]) {
                return b;
            }
        }
    }
};

insertSchema.statics = {
    getBrowserId: function(family) {
        if (typeof ua[family] != 'undefined') {
            return ua[family];
        } else {
            return ua['Other'];
        }
    },
    getOsId: function(family) {
        if (typeof os[family] != 'undefined') {
            return os[family];
        } else {
            return os['Other'];
        }
    }
}

// middleware
/*picSchema.pre('save', function(next) {
    console.log("Pre save!");
    console.log(this);
    return next();
});*/

exports.Insert = mongoose.model('insert', insertSchema);


