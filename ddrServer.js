#!/usr/bin/env node
/**
 ddrServer.js

  Copyright 2012 Hiroya KUBO (hiroya@cuc.ac.jp),
 All rights reserved.
 */

var port = 8124;

var http = require('http'),
    url = require('url'),
    express = require('express'),
    ejs = require('ejs');

var ddr = require('./ddr');


var PREF_ARRAY = [
		  "北海道",
    "青森",
    "岩手",
    "宮城",
    "秋田",
    "山形",
    "福島",
    "茨城",
    "栃木",
    "群馬",
    "埼玉",
    "千葉",
    "東京",
    "神奈川",
    "新潟",
    "富山",
    "石川",
    "福井",
    "山梨",
    "長野",
    "岐阜",
    "静岡",
    "愛知",
    "三重",
    "滋賀",
    "京都",
    "大阪",
    "兵庫",
    "奈良",
    "和歌山",
    "鳥取",
    "島根",
    "岡山",
    "広島",
    "山口",
    "徳島",
    "香川",
    "愛媛",
    "高知",
    "福岡",
    "佐賀",
    "長崎",
    "熊本",
    "大分",
    "宮崎",
    "鹿児島",
    "沖縄",
    "海外"
  ];

var PREF_MAP = {"本日更新された情報":"today",
    "北海道":"%96k%8AC%93%B9",
    "青森":"%90%C2%90X%8C%A7",
    "岩手":"%8A%E2%8E%E8%8C%A7",
    "宮城":"%8B%7B%8F%E9%8C%A7",
    "秋田":"%8FH%93c%8C%A7",
    "山形":"%8ER%8C%60%8C%A7",
    "福島":"%95%9F%93%87%8C%A7",
    "茨城":"%88%EF%8F%E9%8C%A7",
    "栃木":"%93%C8%96%D8%8C%A7",
    "群馬":"%8CQ%94n%8C%A7",
    "埼玉":"%8D%E9%8B%CA%8C%A7",
    "千葉":"%90%E7%97t%8C%A7",
    "東京":"%93%8C%8B%9E%93s",
    "神奈川":"%90_%93%DE%90%EC%8C%A7",
    "新潟":"%90V%8A%83%8C%A7",
    "富山":"%95x%8ER%8C%A7",
    "石川":"%90%CE%90%EC%8C%A7",
    "福井":"%95%9F%88%E4%8C%A7",
    "山梨":"%8ER%97%9C%8C%A7",
    "長野":"%92%B7%96%EC%8C%A7",
    "岐阜":"%8A%F2%95%8C%8C%A7",
    "静岡":"%90%C3%89%AA%8C%A7",
    "愛知":"%88%A4%92m%8C%A7",
    "三重":"%8EO%8Fd%8C%A7",
    "滋賀":"%8E%A0%89%EA%8C%A7",
    "京都":"%8B%9E%93s%95%7B",
    "大阪":"%91%E5%8D%E3%95%7B",
    "兵庫":"%95%BA%8C%C9%8C%A7",
    "奈良":"%93%DE%97%C7%8C%A7",
    "和歌山":"%98a%89%CC%8ER%8C%A7",
    "鳥取":"%92%B9%8E%E6%8C%A7",
    "島根":"%93%87%8D%AA%8C%A7",
    "岡山":"%89%AA%8ER%8C%A7",
    "広島":"%8DL%93%87%8C%A7",
    "山口":"%8ER%8C%FB%8C%A7",
    "徳島":"%93%BF%93%87%8C%A7",
    "香川":"%8D%81%90%EC%8C%A7",
    "愛媛":"%88%A4%95Q%8C%A7",
    "高知":"%8D%82%92m%8C%A7",
    "福岡":"%95%9F%89%AA%8C%A7",
    "佐賀":"%8D%B2%89%EA%8C%A7",
    "長崎":"%92%B7%8D%E8%8C%A7",
    "熊本":"%8CF%96%7B%8C%A7",
    "大分":"%91%E5%95%AA%8C%A7",
    "宮崎":"%8B%7B%8D%E8%8C%A7",
    "鹿児島":"%8E%AD%8E%99%93%87%8C%A7",
    "沖縄":"%89%AB%93%EA%8C%A7",
    "海外":"%8AC%8AO"
};

var app = express();
app.configure(function(){
    app.set('views', __dirname + '/views');
    app.set('view engine', 'ejs');
});
//app.engine('.ejs', ejs);

var server = http.createServer(app).listen(port, function(){
    console.log('Express server listening on port '+port);
});


function replaceAll(expression, org, dest){  
    return expression.split(org).join(dest);  
}  

function toJSON(map){
    var ret = '{';
    var camma = '';
    for(var key in map){
	ret += camma+"\t\""+key+"\": \""+replaceAll(replaceAll(map[key], '"', '\\"'), "\n", "\"+\n\"")+"\"\n";
	camma = ','
    }
    return ret+"}\n";
}

function getShop(json, lat, lng){
    for(var i = 0; i < json.length; i++){
	var shop = json[i];
	if(shop.lat == lat && shop.lng == lng){
	    return shop;
	}
    }
    return null;
}

function writeResultAsJSON(res, result){
    if(result instanceof Array){
	    res.write("[");
	    var prefShopArray = result;
	    var camma = '';
	    for(var i = 0; i < prefShopArray.length; i++){
		res.write(camma);
		res.write(toJSON(prefShopArray[i]));
		camma = ",\n\n";
	    }
	    res.write("]");

    }else if(result instanceof Object){

	var prefMap = result;
	res.write("{");
	var camma = '';
	for(var prefName in prefMap){
	    res.write(camma+'"'+prefName+'":');
	    res.write("[");
	    var prefShopArray = prefMap[prefName];
	    var camma = '';
	    for(var i = 0; i < prefShopArray.length; i++){
		res.write(camma);
		res.write(toJSON(prefShopArray[i]));
		camma = ',';
	    }
	    res.write("]");
	    camma = ",";
	}
	res.write("}");

    }
}

/****************************************************/

//Passing Route Control

// send shop information by json/html
app.get('/shop/:prefIndex/:lat/:lng/:format?', function(req, res, next) {
	var prefIndex = req.params.prefIndex;
	var lat = req.params.lat;
	var lng = req.params.lng;

	if(prefIndex && lat && lng){
	    prefIndex = parseInt(prefIndex);
	    var url = 'http://www.ddr-navi.jp/db/herodb.cgi?table=ddr&search='+PREF_MAP[PREF_ARRAY[prefIndex]];
	    ddr.scrapePref(url, prefIndex, function(shopArray){
		    if(! req.params.format || req.params.format == 'json'){
			res.writeHead(200, {'content-type': 'application/json; charset=utf-8'});
			writeResultAsJSON(res, getShop(shopArray, lat, lng));
		    }else if(req.params.format == 'html'){
			res.render('shop.ejs', {
				locals: {
				    shop: getShop(shopArray, lat, lng)
				}
			    });
		    }
		    res.end();
		});
	}else{
	    next();
	}
    });

// shop list in json format
app.get('/shops/:prefIndex?', function(req, res, next) {
	if(req.params.prefIndex){
	    var prefIndex = req.params.prefIndex;
	    var url = 'http://www.ddr-navi.jp/db/herodb.cgi?table=ddr&search='+PREF_MAP[PREF_ARRAY[prefIndex]];
	    prefIndex = parseInt(prefIndex);
	    ddr.scrapePref(url, prefIndex, function(shopArray){
		    res.writeHead(200, {'content-type': 'application/json; charset=utf-8'});
		    writeResultAsJSON(res, shopArray);
		    res.end();
		});
	}else{
	    next();
	}
    });


// GoogleMap
app.get('/map/:prefIndex?', function(req, res) {
	var prefIndex = (req.params.prefIndex)? req.params.prefIndex : 
	    ((req.query.prefIndex)?req.query.prefIndex:-1);

	// show GoogleMap of pref
	res.render('map.ejs', {
		locals: {
		    prefIndex:  prefIndex
			}
	    });
	res.end();
    });

// HTML of selecting shop list by pref.
app.get('/', function(req, res) {

      res.render('form.ejs', {
	      locals: {
	      }
	  });
      res.end();
    });


//app.listen(port);
