const http = require('http');

const port = 3333;

const server = require('./src/index.js');

server.listen(port);

console.log(`server listening at port: ${port}`);

let vs = [
  // 'NnTg4vzli5s'
  //'sQVeK7Dt18U',
  //'kqq_oq6QWZI',
  //'d0TX75q6Y1M',
  //'lFMkAdg0E-Q',
  //'RaY4Rg-2sBA',
  //'Owbd9lvNM2Q',
  //'2t4ojjzJJZ4',
  //'Lk6oSIjc6hI',
  //'lTG3J_3M_NM',
  //'lyVdW9FE9vY',
  //'d_qGO4GrbQM',
  //'3_7N_J0ofu8',
  //'_tFOJFyTl1U',
  //'SThz_pIUggA',
  //'U6viBSkLkSk',
  //'JJeb1eEZYhI',
  //'ba_5tGIRTFU',
  //'VOvEg-tWoYs',
  //'4ndJbv17IhA'

  //'NnTg4vzli5s'
  //'RaY4Rg-2sBA'

  // 'UlrNYG2Jbzk',
  // 'lI9APCqNlCY',
  // 'C-60uqN0Ufk',
  // 'Ga5IxG6YJfs',
  // 'L_Y0Jw0bWhg',
  // 'LO6Z38rymOQ',
  // 'E7WR3XFseQU',
  // 'MlbAVuU29Eo',
  // 'ohz5CTO-vEg',
  // 'grjx9ICl4m4',
  // '9qkUT8Pec9E',
  // 'LQgLd-PlisM',
  // 'cKrUl6_yPPs',
  // 'AyjO2127itQ',
  // 'xaQi9Nkd0vk',
  // 'kZhMfouWBa4',
  // 'bYQbcwq3j9E',
  // 'CXc9SaJBJQQ',
  // 'lAXheu04D-I',
  // '1WW1AImTa3c',

  // 'RT15NIiREzc',
  // '4JNazsWQ_Fs',
  // 'tpovngoiDvQ',
  // 'mxjYXWFcXsk',
  // 'Lh7hvYXys6o',
  // 'x8LaSt-HG04',
  // '-cTxjq9rXwI',
  // 'p2PxA_SJ5s0',
  // 'hpUKHcUOgVY',
  // '53nr11eqqWs',
  // 'HOdIInnB2IM',
  // 'SqQ_7N23wTs',
  // 'Em1X4MUWqs4',
  // 'GF-hrZyBHwU',
  // 'yF74OxgqJd4',
];

vs.forEach(v => {
  const req = http.request({
    hostname: 'localhost',
    port: port,
    path: `/downloads/${v}`,
    method: 'POST'
  });
  req.on('error', e => {
    console.error(`problem with request: ${e.message}`);
  });
  req.end();
});
