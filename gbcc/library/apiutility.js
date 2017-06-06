let parser = require('xml2json');

let cleanData = (data) => {

  console.log('calling clean data :: ');

  if(!data){ return {}; }

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

exports.getData = (http, data, dcb, ucb, resolve, reject) => {
  let url = ucb(data);

  http.get(url, function(res){
    let rawdata = '';

    res.on('error', (err) => {
      console.log('getData on error is :: ', err);
      reject(err);
    });

    res.on('data', (chunk) => { rawdata += chunk; } );

    res.on('end', () => {

      if(!rawdata){
        data.err.push('mising raw data');

        reject(data);
      }

      let output = {};

      try{
        output = parser.toJson(rawdata, {object: true, sanitize: true});

        dcb(output, data);

        console.log('calling resolve after processing url :: ', url);

        data.err.push('HCF');
        reject(data);
        //resolve(data);
      }
      catch(err){
        data.err.push(err);
        reject(data);
      }
    });
  });
};

exports.vocabDataCB = (input, output) => {
    output.tid = input.response.terms.term[0].tid;

    return output;
  };

exports.vocabUrlCB = (data) => {

  return 'http://d6api.gaia.com/vocabulary/1/' + data.tid;
};

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
  
exports.termUrlCB = (data) => {
  let url = 'http://d6api.gaia.com/videos/term/' + data.tid;

  return url;
};

exports.mediaDataCB = (input, output) => {

  output.bcHLS = input.response.mediaUrls.bcHLS;

  return output;
}

exports.mediaUrlCB = (data) => {
  return 'http://d6api.gaia.com/media/'+ data.previewNid;
};

exports.end = (data) => {
  let _data = cleanData(data);
  console.log(':: calling end in util :: ');
  data.res.setHeader('Content-Type', 'application/json');
  data.res.send(JSON.stringify(_data));
};