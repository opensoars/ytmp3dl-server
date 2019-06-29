const is = require('is');

const express = require('express');
const server = express();

const ytmp3dl = require('./../../ytmp3dl-core/src/index.js');

const Download = ytmp3dl.Download;
ytmp3dl.cleanTemp();

const log = console.log;

const downloads = (function (dls) {
  dls = {
    d: {} 
  };
  dls.get = function (key) {
    if (!key) return dls.d;
    return dls.d[key];
  };
  dls.set = function () {
    if (is.object(arguments[0]))
      for (let key in arguments[0])
        if (arguments[0].hasOwnProperty(key))
          dls.d[key] = arguments[0][key];
    if (is.string(arguments[0]) && arguments[1])
      dls.d[arguments[0]] = arguments[1];

    return dls;
  };
  dls.del = function () {
    if (is.string(arguments[0]))
      delete dls.d[arguments[0]];
    else if (is.array(arguments[0]))
      arguments[0].forEach(el => delete dls.d[el]);

    return dls;
  };
  return dls;
}({}));


server.get('/download', (req, res, next) => {
  const pubs = {};
  const dls = downloads.get();
  for (let k in dls)
    pubs[k] = dls[k].pub;
  res.json(pubs);
});

server.get('/download/:v', (req, res, next) => {
  if (downloads.get(req.params.v)) {
    res.json(downloads.get(req.params.v).pub);
  }
  else {
    res.json({ success: false, error: `No such download: ${req.params.v}` });
  }
});

server.post('/download/:v', (req, res, next) => {
  if (downloads.get(req.params.v)) {
    res.json({
      error: 'download already present',
      v: req.params.v
    });
  }
  else {
    try {
      let dl = (new Download({v: req.params.v}))
        .on('callMethod', method => log(`callMethod: ${method}`))
        .on('stream-progress', prog => log('stream-progress', prog.percentage))
        .on('conversion-progress', prog => log('conversion-progress', prog))
        .on('error', err => log('error', err))
        .on('success', result => {
          log('success', result);
          const dir = __dirname + '/../done';
          const fileName = result.file_name + '.' + result.file_ext;
          const output = dir + '/' + fileName;

          Download.copyAndClean({
            result_file_location: result.file_location,
            file_ext: result.file_ext,
            output
          });
          //downloads.del(req.params.v);
        });

      for (let k in dl._events) dl.on(k, (...args) => {
        console.log('event', k, args);
      });

      dl.callMethod('start');
      downloads.set(req.params.v, dl);

      res.json({
        'succes': 'download started',
        v: req.params.v
      });
    }
    catch (err) {
      res.json({
        error: 'could not start download (try/catch)',
        v: req.params.v
      });
    }
  }
});


module.exports = server;