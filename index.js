/**
 * Login to pdfer website using iMacros for Firefox
 */
var async = require('async');
module.exports = function(data, cb) {
  // clear all existing cookies and sessions
  if (!data) {
    return cb('"data" parameter missing');
  }
  if (!data.config) {
    return cb('"config" field missing from data parameter');
  }
  if (!data.filePath) {
    return cb('"filePath" field missing from data parameter');
  }

  if (!data.type) {
    return cb('"type" field missing from data parameter. Note that type should be either "ocr" or "text"');
  }

  var config = data.config;
  var filePath = data.filePath;

  var atPage = atUploadPage();
  if (!atPage) {
    var url = 'http://'+config.pdfer.host + ':' + config.pdfer.port + '/upload';
    var code = iimPlay('CODE:URL GOTO='+url);
    if (code !==1) {
      return cb('failed to login to pdfer service, imacros error: ' + iimGetLastError());
    }
    atPage = atUploadPage();
    if (!atPage) {
      return cb('pdfer upload failed, not at upload page after loading url: ' + url);
    }
  }
  uploadFile(data, cb);
};

function uploadFile(data, cb) {
  var typeResult = setUploadType(data.type);
  if (!typeResult) {
    return cb('failed to set upload type in select dropdown, error: ' + iimGetLastError());
  }

  var attachResult = attachFile(data.filePath);
  if (!attachResult) {
    return cb('failed to attach file in upload form: ' + iimGetLastError());
  }

  var submitResult = submitForm();
  if (!attachResult) {
    return cb('error submitting upload form: ' + iimGetLastError());
  }
  getUploadedData(function (err, reply) {
    if (err) { return cb(err); }
    cb(null, reply);
  });
}

function getUploadedData(callback) {
  var maxTries = 100;
  var attempt = 0;
  var complete = false;
  var data;
  async.until(
    function () {
      return complete;
      // if (complete) { return complete; }
      // if (attempt >= maxTries ) {
      //   return true;
      // }
      // return false;
    },
    function (cb) {
      attempt++;
      var complete = isComplete();
      if (complete) {
        getCompleteData(function (err, reply) {
          if (err) { return cb(err); }
          data = reply;
        });
      }
      if (attempt > maxTries) {
        return cb('document failed to parse within alloted time');
      }
      iimDisplay('complete header not found refreshing page');
      var code = iimPlay('CODE: REFRESH');
      if (code !== 1) {
        var msg = 'error refreshing page: ' + iimGetLastError();
        return cb(msg);
      }

      setTimeout(cb, 2000);
  },
    function (err) {
      if (err) { return callback(err); }
      callback(null, data);
    }
  );
}

function getCompleteData(cb) {
  var code = iimPlay('CODE: SET !TIMEOUT_TAG 0\n'
                     + 'TAG POS=1 TYPE=DIV ATTR=ID:data EXTRACT=TXT');
  if (code !== 1) {
    return cb('failed to get data, bad return code when extracting text. ' + iimGetLastError());
  }
  var extract = iimGetLastExtract();
  var data = JSON.parse(extract);
  return cb(null, data);
}
function isComplete() {
  var code = iimPlay('CODE: SET !TIMEOUT_TAG 0\n'
                     + 'TAG POS=1 TYPE=H2 ATTR=TXT:Processing<SP>Complete');
  if (code === 1) {
    return true;
  }
  return false;
}
function setUploadType(type) {
  var code = iimPlay('CODE: SET !TIMEOUT_TAG 0\n'
                     + 'TAG POS=1 TYPE=SELECT FORM=ACTION:# ATTR=NAME:type CONTENT=%'+type);
  if (code !== 1) {
    return false;
  }
  return true;
}

function attachFile(filePath) {
  var code = iimPlay('CODE: SET !TIMEOUT_TAG 0\n'
                     + 'TAG POS=1 TYPE=INPUT:FILE FORM=ACTION:# ATTR=NAME:upload CONTENT='+filePath);
  if (code !== 1) {
    return false;
  }
  return true;
}

function submitForm() {
  var code = iimPlay('CODE: SET !TIMEOUT_TAG 0\n'
                     + 'TAG POS=1 TYPE=INPUT:SUBMIT FORM=ACTION:# ATTR=*');
  if (code !== 1) {
    return false;
  }
  return true;
}

function atUploadPage() {
  var code = iimPlay('CODE:SET !TIMEOUT_TAG 0\n'
                     + 'TAG POS=1 TYPE=H1 ATTR=TXT:Upload<SP>PDF');
  if (code === 1) {
    return true;
  }
  return false;
}