var express = require('express');
var app = new express();
var Bing = require('node-bing-api')({ accKey: "966dc7d004304657b4ff3854c44cad5d" });

var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
//var dbURI = 'mongodb://localhost/imagesearch';
var dbURI = 'mongodb://test:pwd@ds123381.mlab.com:23381/imagesearch';
mongoose.connect(dbURI);

var Schema = mongoose.Schema;
var history = new Schema({
    searchTerm: String,
    date: {type: Date, "default": Date.now}
});

var searchHist = mongoose.model('history', history);

app.get('/search/:term', function(req, res){
    console.log('pagination = ', req.query.offset);
    var offset = req.query.offset;
    if(offset === undefined){
        offset = 10;
    };
    console.log('term ', req.params.term);
    var searchTerm = req.params.term;
    var list = [];
    var listObj = {'url': '', 'snippet': '', 'thumbnail': '', 'context': ''};
    var output = searchForImages(searchTerm, function(err, data){
        if(err){
            console.log(err);
            res.json({'error' : 'No search items'});
        } else {
            for (var i = 0; i < offset; i++){
                listObj.url = data.value[i]['contentUrl'];
                listObj.snippet = data.value[i]['name'];
                listObj.thumbnail = data.value[i]['thumbnailUrl'];
                listObj.context = data.value[i]['hostPageUrl'];
                list.push(listObj);
                listObj = {};
            }
            saveSearch(searchTerm);
            res.json(list);
        }
    });
});

app.get('/history', function(req, res){
    console.log('history');
    var histObj = {'searchTerm': '', 'when': ''};
    var history = [];
    searchHist.find({}, function (err, docs){
        if(err){
            console.log(err);
            res.send(err);
        } else {
            console.log(docs.length);
        }
        //res.send({'result': 'Results here'});
        for (var i = 0; i < docs.length; i++){
            histObj.searchTerm = docs[i]['searchTerm'];
            histObj.when = docs[i]['date'];
            history.push(histObj);
            histObj = {};
        }
        res.send(history);
    })
});


app.listen(process.env.PORT, process.env.IP, function(){
    console.log("Short url microservice has started!");
});

function searchForImages(searchTerm, callback){
    console.log('search begin');
    Bing.images(searchTerm, {
          top: 15,   // Number of results (max 50) 
          skip: 3    // Skip first 3 result 
          }, function(error, res, body){
              if(error){
                  callback(error);
              } else {
                  //console.log(body);
                  callback(undefined, body);
              }
      });
}

function saveSearch(searchTerm){
    var searchObj = new searchHist({'searchTerm': searchTerm, 'date': Date.now()});
    searchObj.save({'searchTerm': searchTerm}, function(err, doc){
        if(err){
            console.log('error saving to DB', err);
            return;
        } else {
            console.log('insert success');
            return;
        }
    });
}
