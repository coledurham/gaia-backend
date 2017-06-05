'use strict'

var express = require('express');
var router = express.Router();
var http = require('http');
var parser = require('xml2json');

let end = (req, res, data) => {
  //console.log('final data is :: ', data);
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(data));
};

function processData(req, res, cb){
  let url = 'http://d6api.gaia.com/vocabulary/1/26681';
  cb(req, res, url, getTerm);
}

let getVocab = (req, res, url, cb) => {
  let data = {};

  http.get(url, function(resp){
    let rawdata = '';

    resp.on('data', (chunk)=> { rawdata += chunk});

    resp.on('end', ()=> {
      let output = parser.toJson(rawdata, {object: true, sanitize: true});

      let tid = output.response.terms.term[0].tid;

      cb(req, res, data, ('http://d6api.gaia.com/videos/term/'+ tid), getMedia);

    });
  });
};

let getTerm = (req, res, data, url, cb)=> {

  http.get(url, function(resp){
    let rawdata = '';

    resp.on('data', (chunk)=> { rawdata += chunk});

    resp.on('end', ()=> {
      let output = parser.toJson(rawdata, {object: true, sanitize: true}),
          titles = output.response.titles,
          index = 0,
          maxDuration = 0,
          title = null;

      for(var i = 0; i<titles.title.length; i++){
        if(titles.title[i]
            &&
            titles.title[i].preview
            &&
            titles.title[i].preview.duration != undefined
            &&
          parseInt(titles.title[i].preview.duration) > maxDuration){
          maxDuration = parseInt(titles.title[i].preview.duration);
          index = i;
        }
      }
      title = titles.title[index];

      data.titleNid = title.nid;
      data.previewNid = title.preview.nid;
      data.previewDuration = title.preview.duration;

      getMedia(req, res, data, ('http://d6api.gaia.com/media/'+ data.previewNid), end);

    });

  });

};

let getMedia = (req, res, data, url, cb) => {

  http.get(url, function(resp){
    let rawdata = '';

    resp.on('data', (chunk)=> { rawdata += chunk});

    resp.on('end', ()=> {
      let output = parser.toJson(rawdata, {object: true, sanitize: true});

      data.bcHLS = output.response.mediaUrls.bcHLS;

      cb(req, res, data);
    });

  });
};

router.get('/terms/:tid/longest-preview-media-url', function(req, res, next){
  processData(req, res, getVocab);
});

module.exports = router;
