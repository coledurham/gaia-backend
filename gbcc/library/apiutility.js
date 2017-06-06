/**************************
*  Data and url callbacks
**************************/

exports.vocabDataCB = (input, output) => {
    output.tid = input.response.terms.term[0].tid;
    return output;
  };

exports.vocabUrlCB = (tid) => {

  return 'http://d6api.gaia.com/vocabulary/1/' + tid;
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

exports.end = (req, res, data) => {

};