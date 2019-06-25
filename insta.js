"use strict";

const port = 3333;

const server = require('./dist/index.js');

server.listen(port);

console.log(`server listening at port: ${port}`);
