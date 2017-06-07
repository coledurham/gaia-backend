'use strict'

//Import http for executing http requests to api endpoints
let http = require('http');

//Import xml2json for parsing returned xml to json
let parser = require('xml2json');

//Get data callback for processing data and calling next callback in chain
let getData = (req, res, urlcb, data, datacb, cbs) => {
  let _data = {}, url = urlcb(data);

  //End request if no url; should not be called in normal operation
  if(!url){
    end(req, res, data);
  }
  else{

    //Execute http.get request to fetch and process data from api endpoint
    http.get(urlcb(data), function(resp){
      let rawdata = '';

      //Handle errors with http.get
      resp.on('error', (err)=> { end(req, res, {}); } );

      //Append chunked data into one string
      resp.on('data', (chunk)=> { rawdata += chunk});

      //Process data once all of it is loaded
      resp.on('end', ()=> {

        //End  rquest if no data returned
        if(!rawdata){
          end(req, res, {});
        }
        
        //Parse data and assign output json to variable
        let parsed = parser.toJson(rawdata, {object: true, sanitize: true});

        //Process data and assigned processed data to variable
        _data = datacb(parsed, data);

        //If multiple callbacks call current callback and pass data and remaining callback
        if(cbs !== null && cbs.length > 1){
          cbs[0](req, res, _data, cbs.slice(1, cbs.length));
        }
        else if(cbs !== null && cbs.length == 1){
          //If only one callback execute lone callback passing data and null callbacks array
          cbs[0](req, res, _data, null);
        }
        else{
          //Remove tid from output and end request as we have completed
          delete data.tid;
          end(req, res, _data);
        }

      });
    });
  }
};

//Callback for ending request and returning data
let end = (req, res, data) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(data));
};

/************************************
* Vocabulary function for retrieving
* vocabulary data processing and
* seeding callback
*
* @param {object} req - nodejs
    request object
  @param {object} res - nodejs
    response object
  @param {string} url - url for
    getData/http.get to call for
    data
  @param {object} data - data to 
    be processed and pipelined
  @cbs {array} cbs - array of callbacks
    to call after processing current
    fucntion
************************************/
let getVocab = (req, res, url, data, cbs) => {

  //Data processing callback
  function datacb(input, output){
    output.tid = input.response.terms.term[0].tid;
    return output;
  };

  //URL callback
  function urlcb(data){

    return url;
  };

  //Kickoff request
  getData(req, res, urlcb, data, datacb, cbs);
}

/************************************
* Terms function for retrieving
* terms data processing
*
* @param {object} req - nodejs
    request object
  @param {object} res - nodejs
    response object
  @param {object} data - data to 
    be processed and pipelined
  @cbs {array} cbs - array of callbacks
    to call after processing current
    fucntion
************************************/
let getTerm = (req, res, data, cbs) => {

  //Data processing callback
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
  
  //Url callback
  function urlcb(data){
    let url = 'http://d6api.gaia.com/videos/term/' + data.tid;

    return url;
  };

  //Kickoff request
  getData(req, res, urlcb, data, datacb, cbs)
}

/**********************************
* Media function for retrieving
* terms data processing
*
* @param {object} req - nodejs
    request object
  @param {object} res - nodejs
    response object
  @param {object} data - data to 
    be processed and pipelined
  @cbs {array} cbs - array of callbacks
    to call after processing current
    fucntion
************************************/
let getMedia = (req, res, data, cbs) => {

  //Data processing callback
  function datacb(input, output){

    output.bcHLS = input.response.mediaUrls.bcHLS;

    return output;
  }

  //Url callback
  function urlcb(data){
    return 'http://d6api.gaia.com/media/'+ data.previewNid;
  };

  //Kick off request
  getData(req, res, urlcb, data, datacb, cbs)
}

/**********************************
* Entrypoint into data call/request
* 
* @param {object} req - nodejs
    request object
  @param {object} res - nodejs
    response object
  @param {number} tid - term id to
    use for initial data pull in
    pipeline
************************************/
let processData = (req, res, tid) => {
  getVocab(req, res, ('http://d6api.gaia.com/vocabulary/1/' + tid), {}, [getTerm, getMedia]);
}

//Expose entrypoint to the world
exports.processData = processData;