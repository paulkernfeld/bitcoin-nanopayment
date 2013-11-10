// Copyright 2013 Paul Kernfeld

// This file is part of bitcoin-nanopayment.

//  bitcoin-nanopayment is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.

//  bitcoin-nanopayment is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.

//  You should have received a copy of the GNU General Public License
//  along with bitcoin-nanopayment.  If not, see <http://www.gnu.org/licenses/>.

'use strict';

// Internal imports
var nanopayments = require('../lib/bitcoin-nanopayment');
var Client = nanopayments.Client;

// External imports
var jayson = require('jayson');
var assert = require('assert');

// This server accepts incoming JSON-RPC connections over HTTP. This lets
// code in other languages use this library. See `rpc-client.js` for an example
// of what an RPC client library might look like.
//
// The clientconfig object must have the following fields:
//
// {
//   rpc: {
//     port: integer
//   }
// }
exports.Server = function(clientConfig) {

  var serverRunning;
  var accounts = {};

  var client = new Client(clientConfig);
  
  // create a server
  var server = jayson.server({

    createAccount: function(address, privateKey, cb) {
      client.getAccount(address, privateKey, function(err, account) {
        if (err) {
          cb(err);
        }
        accounts[address] = account;
        cb(null, address);
      });
    },

    requestVoucher: function(accountAddress, inverseProbability, fromAddress, cb) {
      accounts[accountAddress].requestVoucher(inverseProbability, fromAddress, cb);
    },

    createVoucher: function(accountAddress, destinationAddress, targetSerialized, cb) {
      accounts[accountAddress].createVoucher(destinationAddress, targetSerialized, cb);
    },

    cashVoucher: function(accountAddress, transactionHex, cb) {
      accounts[accountAddress].cashVoucher(transactionHex, cb);
    }
  });

  // Bind a http interface to the server and let it listen
  // Only allow connections from localhost
  // cb takes only the error
  this.listen = function(cb) {
    serverRunning = server.http();
    serverRunning.on('listening', function() { cb(null); });
    serverRunning.on('error', function(err, b) { cb(err); });
    serverRunning.listen(clientConfig.rpc.port, 'localhost');
  }

  // Call this when you're done to release resources
  this.close = function() {
    serverRunning.close();
  }
};
