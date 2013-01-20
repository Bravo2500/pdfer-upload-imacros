var should = require('should');
var readFile = require('imacros-read-file');
var upload = require('../index');
var login = require('pdfer-login-imacros')
runTests(function (err, reply) {
  if (err) {
    alert('check test suite fails with error: ' + JSON.stringify(err));
    return false;
  }
  iimDisplay('Success! Checks test suite passes');
});

function runTests(cb) {
  iimPlay('CODE:URL GOTO=http://www.google.com');
  var configFilePath = 'file:///users/noah/src/node/pdfer-imacros/pdfer-upload-imacros/test/localConfig.json'
  loadConfigFile(configFilePath, function (err, config) {
    should.not.exist(err, 'error loading config file')
    login(config, function (err, reply) {
      if (err) { return cb(err); }
      var uploadFilePath = '/users/noah/src/node/pdfer-imacros/pdfer-upload-imacros/test/data/multipage_raw.pdf';
      var data = {
        config: config,
        filePath: uploadFilePath,
        type: 'ocr'
      }
      upload(data, function (err, responseData) {
        if (err) { return cb(err); }
        alert('responseData: ' + JSON.stringify(responseData, null, ' '))
        responseData.should.have.property('text_pages');
        var pages = responseData.text_pages;
        alert('pages length: ' + pages.length);
        pages.length.should.eql(2);
        cb();
      });
    });
  });
}

function loadConfigFile(filePath, cb) {
  readFile(filePath, function (err, reply) {
    if (err) { return cb(err); }
    var data = JSON.parse(reply);
    cb(null, data);
  });
}
