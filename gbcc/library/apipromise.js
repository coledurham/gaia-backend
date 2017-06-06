'use strict'

let http = require('http');

let util = require('./apiutility')




/**************************
* Promises/functions for
* retrieving data and 
* returning final data
***************************/


let processData = (req, res, tid) => {
  var main = Promise.resolve({req: req, res: res, tid: tid, err: []});
  
  main
    .then(getVocab, (err)=>{console.log('error handler at vocab :: ', err.err); return err;})
    .then(getTerm, (err)=>{console.log('error handler at term :: ', err.err); return err;})
    .then(getMedia, (err)=>{console.log('error handler at media :: ', err.err); return err;})
    .then(end, end);
};

let errorHandler = (err) => {
  console.log('executing error handler');
  //util.end(req, res, { error: err, tid: err});
  //util.end(err);
  return err
};

//Retireve the vocabulary data
let getVocab = (data) => {

  return new Promise((resolve, reject) => {
    util.getData(http, data, util.vocabDataCB, util.vocabUrlCB, resolve, reject);
  });
};

//Retrieve the term data
let getTerm = (data)=> {

  return new Promise((resolve, reject) => {
    util.getData(http, data, util.termDataCB, util.termUrlCB, resolve, reject);
  });

};

//Retrieve the media data
let getMedia = (data) => {

  return new Promise((resolve, reject) => {
    util.getData(http, data, util.mediaDataCB, util.mediaUrlCB, resolve, reject);
  });
};

//End the request
let end = (data) => {
   return new Promise((resolve, reject) => {
      util.end(data);
   });
};

exports.processData = processData;
