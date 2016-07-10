const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const path = require('path');

const socket = require('./socket');
const routes = require('./routes');

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, '../dist')));
app.use(routes);

socket(io);

server.listen(PORT, () => {
  console.log(`\uD83C\uDF0E App is listening on port ${PORT}`);
});
