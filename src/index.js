"use strict";

const is = require('is');

const express = require('express');
const server = express();

const ytmp3dl = require('ytmp3dl-core');
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


server.post('/downloads/:v', (req, res, next) => {
  if (downloads.get(req.params.v)) {
    res.json({
      error: 'download already present',
      v: req.params.v
    });
  }
  else {
    let dl = (new Download({v: req.params.v}))
      .on('callMethod', method => log(`callMethod: ${method}`))
      .on('stream-progress', prog => log('stream-progress', prog))
      .on('conversion-progress', prog => log('conversion-progress', prog))
      .on('error', err => log('error', err))
      .on('success', result => {
        log('success', result);
        downloads.del(req.params.v);
      });
    dl.callMethod('start');
    downloads.set(req.params.v, dl);

    res.json({
      'succes': 'download started',
      v: req.params.v
    });
    console.log('res json my man');
  }
});


setInterval(() => {


  log(downloads);
}, 500);

module.exports = server;