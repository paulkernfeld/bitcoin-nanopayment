var jayson = require('jayson');

// create a server
var server = jayson.server({
  add: function(a, b, callback) {
    callback(null, a + b);
  }
});

// Bind a http interface to the server and let it listen to localhost:3000
var serverRunning = server.http().listen(3000);

// create a client
var client = jayson.client.http({
  port: 3000,
  hostname: 'localhost'
});

// invoke "add"
client.request('add', [1, 1], function(err, error, response) {
  if(err) throw err;
  console.log(response); // 2!
  serverRunning.close();
});
