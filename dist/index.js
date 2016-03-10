"use strict";

const express = require('express');
const server = express();

const Download = require('ytmp3dl-core').Download;

const downloads = [];

downloads.remove = function () {};

downloads.add = function () {};

server.post('/downloads/:v', (req, res, next) => {
  console.log(req.params);
  res.json(req.params);

  downloads.push(new Download({ v: req.params.v }).on('callMethod', method => console.log(`callMethod: ${ method }`)).on('stream-progress', prog => console.log('stream-progress', prog)).on('conversion-progress', prog => console.log('conversion-progress', prog)).on('error', err => console.log('error', err)).on('succes', result => console.log('succes', result)).callMethod('start'));
});

module.exports = server;