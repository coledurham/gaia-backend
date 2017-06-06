'use strict'

var express = require('express');
var router = express.Router();
var api = require('../library/apipromise');

//API route with cpatuirng
router.get('/terms/:tid/longest-preview-media-url', function(req, res, next){
  api.processData(req, res, req.params.tid);
});

//Defalut route for capturing invlaid/unuspported urls
router.get('*', function(req, res, next){
  res.setHeader('Content-Type', 'text/html');
  res.status(403);
  res.send('Unsupported URL');
});

module.exports = router;
