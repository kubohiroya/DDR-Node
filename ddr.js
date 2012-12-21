/**
 ddr.js

 Copyright 2012 Hiroya KUBO (hiroya@cuc.ac.jp),
 All rights reserved.
 */


    var embedJQuery = require('./embedJQuery'),
       anchorPicker = require('./anchorPicker');

var SHOPS_PAR_PAGE = 30;

var ignorablePrefNames = {
    '東　北':true,
    '関　東':true,
    '中　部':true,
    '近　畿':true,
    '中　国':true,
    '四　国':true,
    '九　州':true,
    '沖　縄':true
};

function addAll(array, append){
    for(var i=0; i<append.length; i++){
	array.push(append[i]);
    }
}

function processURLs(urlArray, anchorTextArray, urlIndex, processFunc, callbackFunc){
    var url = urlArray[urlIndex];
    var prefName = anchorTextArray[urlIndex];
    embedJQuery.jQueryRequest(url, function(err, window, $) {
	    if (err) {
		console.log("**** ERR:"+prefName);
		throw err;
	    }

	    processFunc(url, prefName, $);

	    if(urlIndex + 1 < urlArray.length){
		processURLs(urlArray, anchorTextArray, urlIndex + 1, processFunc, callbackFunc);
	    }else{
		if(callbackFunc){
		    callbackFunc();
		}
	    }
	});
}

function processShops($){

    var prefShopArray = [];

    $("table[cellpadding='2']").each(function() {
	    var shop = {};
	    var name = $(this).find('tr:first > td:first > B:first').text();
	    var shopURL = $(this).find('tr:first > td:eq(2) > a:first').attr("href");
	    var href = $(this).find('tr:first > td:eq(3) > a:eq(1)').attr("href");
	    $(this).find('tr:eq(1) > td:first').html().match(/<table/);
	    var post = RegExp.leftContext;
	    if(name){
		shop.name = name;
	    }
	    if(shopURL){
		shop.shopURL = shopURL;
	    }
	    if(href){
		href.match(/\?q\=([\d\.]+)\,([\d\.]+)\+/);
		shop.lat = RegExp.$1;
		shop.lng = RegExp.$2;
	    }
	    if(post){
		shop.post = post;
	    }
	    prefShopArray.push(shop);
	});

    var i = -1;
    //var prevParentTd = null;
    $("td").each(function() {
	    $(this).find("img").filter(function(index){
		    return 0 == $(this).prev("br").length;
		}).each(function() {

		    var src = $(this).attr("src");
		    var width = $(this).attr("width");
		    var height = $(this).attr("height");
		    if(src && width && height && src != 'http://www.ddr-mnavi.jp/banner.png' && 1 < width && 1 < height){
			i++;
			//console.log(i+":"+src);

		if(i < prefShopArray.length){
		    prefShopArray[i].image = src;
		    prefShopArray[i].imageWidth = width;
		    prefShopArray[i].imageHeight = height;
		}
	    }

	});
    });

    i = 0;
    $("td.small[width='80'][height!='12']").each(function() {
	    var shopIndex = Math.floor(i / 5);
	    var valueIndex = i % 5;
	    var shop = prefShopArray[shopIndex];
	    var value = $(this).html().replace(/&nbsp;/g, '');
	    if(value){
		switch(valueIndex){
		case 0:
		    shop.version = value;
		    break;
		case 1:
		    shop.number = value;
		    break;
		case 2:
		    shop.priceSongs = value;
		    break;
		case 3:
		    shop.links = value;
		    break;
		case 4:
		    shop.premium = value;
		    break;
		default:
		}
	    }
	    i++;
	});

    i = 0;
    $("td.small[width='100'][height!='12']").each(function() {
	    var shopIndex = Math.floor(i / 2);
	    var valueIndex = i % 2;
	    var shop = prefShopArray[shopIndex];
	    var value = $(this).html().replace(/&nbsp;/g, '');
	    if(value){
		switch(valueIndex){
		case 1:
		    shop.eamu = value;
		    break;
		default:
		}
	    }
	    i++;
	});

    return prefShopArray;
}

exports.scrapeAll = function(homeURL, callback){
    
    var prefMap = {};
    var prefMapCount = 0;
    var prefNameArray = [];
    var prefInitialURLArray = [];

    anchorPicker.pickupLinks(homeURL, function(err, links, anchorTexts) {
	    if (err) {
		console.log("**** ERR:"+homeURL);
		throw err;
	    }

	    for(var i = 0; i < links.length; i++){
		var prefName = anchorTexts[i];
		var prefInitialURL = links[i];
		if(prefInitialURL.indexOf('http://www.ddr-navi.jp/db/herodb.cgi?table=ddr&search=') != 0 || ignorablePrefNames[prefName]){
		    continue;
		}
		//console.log('"'+prefName+'":"'+prefInitialURL.substr('http://www.ddr-navi.jp/db/herodb.cgi?table=ddr&search='.length)+'",');
		prefNameArray.push(prefName);
		prefInitialURLArray.push(prefInitialURL);
	    }

	    var prefIndex = 0;

	    processURLs(prefInitialURLArray, prefNameArray, prefIndex, 

			function(prefInitialURL, prefName, $){
			    var pageURLArray = [prefInitialURL];
			    $("td[width='200']:first").each(function() {
				    $(this).text().match(/\/\s+(\d+)/g);
				    var numItems = parseInt(RegExp.$1);
				    for(var j = 1; SHOPS_PAR_PAGE * j < numItems; j++){
					var nextPageURL = prefInitialURL+"&recpoint="+(SHOPS_PAR_PAGE * j);
					pageURLArray.push(nextPageURL);
				    }
				});

			    var prefShopArray = processShops($);


			    if(1 < pageURLArray.length){
				var pageIndex = 1;
				processURLs(pageURLArray, pageURLArray, pageIndex, 
					    function(pageURL, pageName, $){
						addAll(prefShopArray, processShops($));
					    },

					    function(){
						// do something at the end of processing a prefecture 
						//puts("# "+prefShopArray.length+" shops in "+prefName);
					    }
					    );
			    }

			    prefMap[prefName] = prefShopArray;
			    prefMapCount++;
			}, 

			function(){
			    // do something at the end of processing a set of prefectures 
			});

	});

    var hasNotFinished = true;
    var id = setInterval(function(){
	    if(hasNotFinished && prefMapCount == prefNameArray.length){
		hasNotFinished = false;
		callback(prefMap);
		clearInterval(id);
	    }else{
	    }}, 1000);
};

var cache = {}
    exports.scrapePref = function(prefInitialURL, prefIndex, callback){

	if(cache[prefIndex]){
	    callback(cache[prefIndex]);
	    return;
	}
    
    var pageIndex = 0;
    var pageURLArray = [prefInitialURL];
    var prefShopArray = [];

    embedJQuery.jQueryRequest(prefInitialURL, function(err, window, $) {
	    $("td[width='200']:first").each(function() {
		    $(this).text().match(/\/\s+(\d+)/g);
		    var numItems = parseInt(RegExp.$1);
		    for(var j = 1; SHOPS_PAR_PAGE * j < numItems; j++){
			var nextPageURL = prefInitialURL+"&recpoint="+(SHOPS_PAR_PAGE * j);
			pageURLArray.push(nextPageURL);
		    }
		});

	    addAll(prefShopArray, processShops($));
	    pageIndex++;

	    if(1 < pageURLArray.length){
		processURLs(pageURLArray, pageURLArray, pageIndex, 
			    function(pageURL, pageName, $){
				addAll(prefShopArray, processShops($));
				pageIndex++;
			    },

			    function(){
				// do something at the end of processing a prefecture 
			    }
			    );
	    }

	});

    var hasNotFinished = true;
    var id = setInterval(function(){
	    if(hasNotFinished && pageIndex == pageURLArray.length){
		clearInterval(id);
		hasNotFinished = false;
		cache[prefIndex] = prefShopArray;
		callback(prefShopArray);
	    }else{
	    }}, 1000);
}

