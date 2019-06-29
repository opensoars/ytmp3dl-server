const http = require('http');

const port = 3333;

const server = require('./src/index.js');

server.listen(port);

console.log(`server listening at port: ${port}`);


let vs = [
/*  'NnTg4vzli5s',
  'sQVeK7Dt18U',
  'kqq_oq6QWZI',
  'd0TX75q6Y1M',
   'lFMkAdg0E-Q',
  'RaY4Rg-2sBA',
  'Owbd9lvNM2Q', 
  '2t4ojjzJJZ4',
  'Lk6oSIjc6hI',
  'lTG3J_3M_NM',
  'lyVdW9FE9vY',
  'd_qGO4GrbQM',
  '3_7N_J0ofu8',
  '_tFOJFyTl1U',
  'SThz_pIUggA',
  'U6viBSkLkSk',
  'JJeb1eEZYhI',
  'ba_5tGIRTFU',
  'VOvEg-tWoYs',
  '4ndJbv17IhA'*/
    
  'NnTg4vzli5s'
  //'RaY4Rg-2sBA'

];

vs.forEach(v => {
  const req = http.request({
    hostname: 'localhost',
    port: port,
    path: `/download/${v}`,
    method: 'POST',
  });
  req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
  });
  req.end();
});

