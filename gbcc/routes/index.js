'use strict'

var express = require('express');
var router = express.Router();
var api = require('../library/api');

router.get('/terms/:tid/longest-preview-media-url', function(req, res, next){
  api.processData(req, res);
});

router.get('*', function(req, res, next){
  res.setHeader('Content-Type', 'text/html');
  res.send('Unsupported URL');
});

module.exports = router;
