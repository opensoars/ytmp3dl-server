const is = require('is');
const express = require('express');
const bodyParser = require('body-parser');
const { graphqlExpress, graphiqlExpress } = require('apollo-server-express');
const { makeExecutableSchema } = require('graphql-tools');
const cors = require('cors');

const fs = require('fs');
const util = require('util');
const writeFile = util.promisify(fs.writeFile);

//const ytmp3dl = require('./../../ytmp3dl-core/src/index.js');
const ytmp3dl = require('ytmp3dl-core');

const Download = ytmp3dl.Download;
ytmp3dl.cleanTemp();

const log = console.log;

try {
  fs.readFileSync(__dirname + '/../db.json');
} catch (err) {
  fs.writeFileSync(__dirname + '/../db.json', '{}');
}

const diskDownloads = JSON.parse(
  fs.readFileSync(__dirname + '/../db.json') || '{}'
);

const downloads = (function (dls = { d: {} }) {
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

  let lastWrite;
  dls.writeToFile = function () {
    const data = JSON.stringify(dls.get());
    if (data !== lastWrite) {
      fs.writeFile(__dirname + '/../db.json', data, 'utf8', err => {
        if (err) console.log(err);
      });
    }
    lastWrite = data;
  };

  return dls;
})({ d: diskDownloads });
// ({
//   d: {
//     '123': {
//       pub: {
//         start: '456',
//         errs: [],
//         methodsCalled: []
//       }
//     }
//   }
// });

const typeDefs = `
  type Query { downloads: [Download] }
  type Download {
    start: String
    v: String
    completed: Boolean
    error: Boolean
    methodsCalled: [String]
    errs: [String]
    video_info: Video_info
    working_url: String
    file_location: String
    output_location: String
    file_name: String
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

  type Mutation {
    retryDownload(v: String!): Download
    startDownload(v: String!): Download
    deleteDownload(v: String!): Download
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
          errs: dls[v].pub.errs.map(err => (err.stack ? err.stack : err))
        });
      }
      return dlsArr;
    }
  },
  Mutation: {
    retryDownload: (parent, { v }) => {
      if (downloads.get(v)) {
        // downloads.del(v);
        startDownload({
          res: {
            json: () => {
              // console.log('ACTUALLY WORKING....');
            }
          },
          v
        });
      } else {
        return;
        // res.json({ success: false, error: `No such download: ${v}` });
      }
    },
    startDownload: (parent, { v }) => {
      if (!downloads.get(v)) {
        // downloads.del(v);
        startDownload({
          res: {
            json: () => {
              // console.log('ACTUALLY WORKING....');
            }
          },
          v
        });
      } else {
        return;
        // res.json({ success: false, error: `No such download: ${v}` });
      }
    },
    deleteDownload: (parent, { v }) => {
      downloads.del(v);
    }
  }
};

const schema = makeExecutableSchema({
  typeDefs,
  resolvers
});

const app = express();

async function startDownload({ req, res, v }) {
  v = v || req.params.v;
  try {
    let dl = new Download({ v: v })
      .on('callMethod', method => log(`callMethod: ${method}`))
      .on('stream-progress', prog => log('stream-progress', prog.percentage))
      .on('conversion-progress', prog => log('conversion-progress', prog))
      .on('error', err => log('error', err))
      .on('success', async result => {
        log('success', result);
        const dir = __dirname + '/../done';
        let fileName = result.file_name + '.' + result.file_ext;
        let output = dir + '/' + fileName;

        fileName = fileName.replace(/\.\.mp3$/, '.mp3');
        output = output.replace(/\.\.mp3$/, '.mp3');

        await Download.copyAndClean({
          result_file_location: result.file_location,
          file_ext: result.file_ext,
          output
        });

        dl.pub.set('output_location', output);
        dl.pub.set('file_name', fileName);
        //downloads.del(v);
      });

    // for (let k in dl._events)
    //   dl.on(k, (...args) => {
    //     console.log('event', k, args);
    //   });

    dl.callMethod('start');
    downloads.set(v, dl);

    res.json({
      succes: 'download started',
      v: v
    });
  } catch (err) {
    res.json({
      error: 'could not start download (try/catch)',
      v: v
    });
  }
}

app.use(cors());

app.use(express.static(__dirname + '/../done'));

app.use('/graphql', bodyParser.json(), graphqlExpress({ schema }));
app.use('/graphiql', graphiqlExpress({ endpointURL: '/graphql' }));

app.get('/ping', (req, res, next) => {
  res.end('');
});

let writeInterval;

app.get('/writeFiles/:interval', (req, res, next) => {
  writeInterval = setInterval(() => {
    downloads.writeToFile();
  }, req.params.interval || 2500);
  res.json({ success: true });
});

app.get('/stopWriteFiles', (req, res, next) => {
  clearInterval(writeInterval);
  res.json({ success: true });
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
    startDownload({ req, res, v });
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
    startDownload({ req, res, v });
  }
});

app.delete('/downloads/:v', (req, res, next) => {
  res.end('delete: ' + req.params.v);
});

module.exports = app;
