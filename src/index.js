const is = require('is');
const express = require('express');
const bodyParser = require('body-parser');
const { graphqlExpress, graphiqlExpress } = require('apollo-server-express');
const { makeExecutableSchema } = require('graphql-tools');
const cors = require('cors');

//const ytmp3dl = require('./../../ytmp3dl-core/src/index.js');
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
        if (arguments[0].hasOwnProperty(key)) dls.d[key] = arguments[0][key];
    if (is.string(arguments[0]) && arguments[1])
      dls.d[arguments[0]] = arguments[1];

    return dls;
  };
  dls.del = function () {
    if (is.string(arguments[0])) delete dls.d[arguments[0]];
    else if (is.array(arguments[0]))
      arguments[0].forEach(el => delete dls.d[el]);

    return dls;
  };
  return dls;
})({});

const typeDefs = `
  type Query { downloads: [Downloads] }
  type Downloads {
    start: String
    v: String
    completed: Boolean
    error: Boolean
    methodsCalled: [String]
    errs: [String]
    video_info: Video_info
    working_url: String
    file_location: String
    output_file: String
    streamProgress: StreamProgress
    conversionProgress: ConversionProgress
  }
  type Video_info {
    title: String
    length_seconds: Int
  }
  type StreamProgress {
    bytesWritten: Float
    bytesTotal: Float
    percentage: Float
  }
  type ConversionProgress {
    current: Float
    total: Float
    percentage: Float
  }
`;

const resolvers = {
  Query: {
    downloads: () => {
      const dls = downloads.get();
      const dlsArr = [];
      for (let v in dls) {
        dlsArr.push({
          v,
          ...dls[v].pub,
          errs: dls[v].pub.errs.map(err => err.stack)
        });
      }
      return dlsArr;
    }
  }
  // Mutation: {}
};

const schema = makeExecutableSchema({
  typeDefs,
  resolvers
});

const app = express();

async function startDownload({ req, res, next, v }) {
  try {
    let dl = new Download({ v: req.params.v })
      .on('callMethod', method => log(`callMethod: ${method}`))
      .on('stream-progress', prog => log('stream-progress', prog.percentage))
      .on('conversion-progress', prog => log('conversion-progress', prog))
      .on('error', err => log('error', err))
      .on('success', async result => {
        log('success', result);
        const dir = __dirname + '/../done';
        const fileName = result.file_name + '.' + result.file_ext;
        const output = dir + '/' + fileName;

        await Download.copyAndClean({
          result_file_location: result.file_location,
          file_ext: result.file_ext,
          output
        });

        dl.pub.set('output_file', output);
        //downloads.del(req.params.v);
      });

    for (let k in dl._events)
      dl.on(k, (...args) => {
        console.log('event', k, args);
      });

    dl.callMethod('start');
    downloads.set(req.params.v, dl);

    res.json({
      succes: 'download started',
      v: req.params.v
    });
  } catch (err) {
    res.json({
      error: 'could not start download (try/catch)',
      v: req.params.v
    });
  }
}

app.use(cors());

app.use('/graphql', bodyParser.json(), graphqlExpress({ schema }));
app.use('/graphiql', graphiqlExpress({ endpointURL: '/graphql' }));

app.get('/ping', (req, res, next) => {
  res.end('');
});

app.get('/downloads', (req, res, next) => {
  const pubs = {};
  const dls = downloads.get();
  for (let k in dls) pubs[k] = dls[k].pub;
  res.json(pubs);
});

app.get('/downloads/:v', (req, res, next) => {
  if (downloads.get(req.params.v)) {
    res.json(downloads.get(req.params.v).pub);
  } else {
    res.json({ success: false, error: `No such download: ${req.params.v}` });
  }
});

app.put('/downloads/:v', (req, res, next) => {
  const v = req.params.v;
  if (downloads.get(v)) {
    downloads.del(v);
    startDownload({ req, res, next, v });
  } else {
    res.json({ success: false, error: `No such download: ${v}` });
  }
});

app.post('/downloads/:v', (req, res, next) => {
  const v = req.params.v;
  if (downloads.get(v)) {
    res.json({
      error: 'download already present',
      v: v
    });
  } else {
    startDownload({ req, res, next, v });
  }
});

app.delete('/downloads/:v', (req, res, next) => {
  res.end('delete: ' + req.params.v);
});

module.exports = app;
