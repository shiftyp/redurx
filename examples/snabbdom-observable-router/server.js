var express = require('express');
var path = require('path');

var app = new express();
var port = process.env.PORT || 3000;

app.use(express.static('./dist'));

app.use('*', function(req, res) {
  res.sendFile(path.join(__dirname, './dist/index.html'));
});

app.listen(port, function(error) {
  if (error) {
    console.error(error);
  } else {
    console.info("Listening on port:", port);
  }
});
