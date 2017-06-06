'use strict'

let http = require('http');
let parser = require('xml2json');
let util = require('./apiutility')




/**************************
* Promises/functions for
* retrieving data and 
* returning final data
***************************/
let end = (req, res, data) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(data));
};

let processData = (req, res, tid, cb) => {
  let url = 'http://d6api.gaia.com/vocabulary/1/' + tid;
  cb = cb || getVocab;

  cb(req, res, url, getTerm);
};

let processdata = (req, res, tid, cb) => {
  var main = Promise.resolve({});
  
  main
    .then(getVocab)
    .then(getTerm)
    .then(getMedia)
    .then(end)
    .catch(errorhandler);
};

//Retireve the vocabulary data
let getVocab = (req, res, url, cb) => {
  let data = {};

  http.get(url, function(resp){
    let rawdata = '';

    resp.on('error', (err)=> { end(req, res, {}); } );

    resp.on('data', (chunk)=> { rawdata += chunk});

    resp.on('end', ()=> {

      if(!rawdata){
        end(req, res, {});
      }

      let output = parser.toJson(rawdata, {object: true, sanitize: true});

      let tid = output.response.terms.term[0].tid;

      cb(req, res, data, ('http://d6api.gaia.com/videos/term/'+ tid), getMedia);

    });
  });
};

//Retrieve the term data
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

exports.processData = processData;
