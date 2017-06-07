//Import xml2json to convert xml response to json for processing
let parser = require('xml2json');

//Utility function for sanitizing ourd for output
let cleanData = (data) => {

  if(!data){ return {}; }

  //Return object literal with fields defaulted to empty string if not present
  return {
    tid: data.tid || '',
    titleNid: data.titleNid || '',
    previewNid: data.previewNid || '',
    previewDuration: data.previewDuration || '',
    bcHLS: data.bcHLS ||''
  };
};

/**************************
*  Data and url callbacks
**************************/

/************************************
* Data retrieval function that calls
* get method of http module to request
* data from http endpoints
*
* @param {object} http - http module
* @param {object} data - data object
    with req/res, etc and data from
    previous requests
  @param {function} dcb - callback
    for processing data returned
    from http.get
  @param {function} ucb - callback
    for getting url for call
  @param {function} resolve - promise
    resolve function
  @param {function} reject - promise
    reject function
************************************/
exports.getData = (http, data, dcb, ucb, resolve, reject) => {
  let url = ucb(data);

  http.get(url, function(res){
    let rawdata = '';

    res.on('error', (err) => {
      reject(err);
    });

    //Append our incoming data
    res.on('data', (chunk) => { rawdata += chunk; } );

    //Process all data as request has finished
    res.on('end', () => {

      if(!rawdata){
        //Add error mesage and reject
        data.err.push('mising raw data');

        reject(data);
      }

      let output = {};

      //Try/catch around parse as it throws error
      try{
        output = parser.toJson(rawdata, {object: true, sanitize: true});

        //Process data returned from http.get
        dcb(output, data);

        //data.err.push('HCF');
        //reject(data);

        //Resolve call with data
        resolve(data);
      }
      catch(err){
        //Catch parsing error and reject
        data.err.push(err);
        reject(data);
      }
    });
  });
};


/************************
* Data and url call back
* functions
************************/


/*******************************
* Vocabulary request
* data callback
*
* @param {object} input - object
*   containing data from http
* @param {object} output - object
*   to append formatted data to
*********************************/

exports.vocabDataCB = (input, output) => {
    output.tid = input.response.terms.term[0].tid;

    return output;
  };

/*******************************
* Vocabulary request url callback
*
* @param {object} data - object
*   containing data for url
*********************************/
exports.vocabUrlCB = (data) => {

  return 'http://d6api.gaia.com/vocabulary/1/' + data.tid;
};

/*******************************
* Terms request
* data callback
*
* @param {object} input - object
*   containing data from http
* @param {object} output - object
*   to append formatted data to
*********************************/
exports.termDataCB = (input, output) => {
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

/*******************************
* Term request url callback
*
* @param {object} data - object
*   containing data for url
*********************************/
exports.termUrlCB = (data) => {
  let url = 'http://d6api.gaia.com/videos/term/' + data.tid;

  return url;
};

/*******************************
* Media request
* data callback
*
* @param {object} input - object
*   containing data from http
* @param {object} output - object
*   to append formatted data to
*********************************/
exports.mediaDataCB = (input, output) => {

  output.bcHLS = input.response.mediaUrls.bcHLS;

  return output;
}

/*******************************
* Media request url callback
*
* @param {object} data - object
*   containing data for url
*********************************/
exports.mediaUrlCB = (data) => {
  return 'http://d6api.gaia.com/media/'+ data.previewNid;
};


/*******************************
* End callback that returns
* the current http request
*
* @param {object} data - object
*   containing data for url
*********************************/
exports.end = (data) => {
  //Clean data
  let _data = cleanData(data);

  //Set header and return
  data.res.setHeader('Content-Type', 'application/json');
  data.res.send(JSON.stringify(_data));
};