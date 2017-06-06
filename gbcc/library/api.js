'use strict'

let http = require('http');
let parser = require('xml2json');

let getData = (req, res, urlcb, data, datacb, cbs) => {
  console.log('in getdata ::');
  let _data = {}, url = urlcb(data);

  if(!url){
    end(req, res, data);
  }
  else{
    console.log('url to process is :: ', urlcb(data));
    http.get(urlcb(data), function(resp){
      let rawdata = '';

      resp.on('error', (err)=> { end(req, res, {}); } );

      resp.on('data', (chunk)=> { rawdata += chunk});

      resp.on('end', ()=> {

        if(!rawdata){
          end(req, res, {});
        }
        
        let parsed = parser.toJson(rawdata, {object: true, sanitize: true});

        _data = datacb(parsed, data);

        if(cbs !== null && cbs.length > 1){
          console.log('cbs greater than 1')
          cbs[0](req, res, _data, cbs.slice(1, cbs.length));
        }
        else if(cbs !== null && cbs.length == 1){
          console.log('cbs = 1 :: calling with null');
          cbs[0](req, res, _data, null);
        }
        else{
          delete data.tid;
          end(req, res, _data);
        }

      });
    });
  }
};

let end = (req, res, data) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(data));
};

let getVocab = (req, res, url, data, cbs) => {

  function datacb(input, output){
    output.tid = input.response.terms.term[0].tid;
    return output;
  };

  function urlcb(data){

    return url;
  };

  getData(req, res, urlcb, data, datacb, cbs);
}

let getTerm = (req, res, data, cbs) => {

  function datacb(input, output){
    let titles = input.response.titles,
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

    output.titleNid = title.nid;
    output.previewNid = title.preview.nid;
    output.previewDuration = title.preview.duration;

    return output;
  }
  
  function urlcb(data){
    let url = 'http://d6api.gaia.com/videos/term/' + data.tid;

    return url;
  };

  getData(req, res, urlcb, data, datacb, cbs)
}

let getMedia = (req, res, data, cbs) => {

  function datacb(input, output){

    output.bcHLS = input.response.mediaUrls.bcHLS;

    return output;
  }

  function urlcb(data){
    return 'http://d6api.gaia.com/media/'+ data.previewNid;
  };

  getData(req, res, urlcb, data, datacb, cbs)
}

let processData = (req, res, tid) => {
  getVocab(req, res, ('http://d6api.gaia.com/vocabulary/1/' + tid), {}, [getTerm, getMedia]);
}

exports.processData = processData;