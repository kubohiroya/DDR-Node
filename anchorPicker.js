/**
 anchorPicker.js

 Copyright 2012 Hiroya KUBO (hiroya@cuc.ac.jp),
 All rights reserved.
 */

// anchorPicker.js
// HTMLコンテンツからリンク（aタグ）を取り出す

var url = require('url'),
    embedJQuery = require('./embedJQuery');

// jQueryでaタグを取り出しcallbackを起動
exports.pickupLinks = function(targetUrl, callback) {
    embedJQuery.jQueryRequest(targetUrl, function(err, window, $) {
        if (err) {
            if (callback) {
                callback(err);
            } else {
                throw err;
            }
            return;
        }

	var anchorTexts = [];
        var links = [];
        $('a').each(function() {
		links.push(this.href);
		anchorTexts.push($(this).text().trim());
        });

        if (callback) {
            callback(null, links, anchorTexts);
        }
    });
}
