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

// External imports
var jayson = require('jayson');

// This creates a client object that accesses a bitcoin-nanopayment server (see
// rpc-server.js) over RPC. In order for this to work, the RPC server must be
// running. There's probably no reason you'd need this in node; it's just an
// example implementation of the bitcoin-nanopayment RPC client. clientConfig
// should look like:
//
// {
//   timeout: integer (optional, milliseconds),
//   minConf: integer (optional),
//   rpc: {
//     host: string,
//     port: integer
//   }
// }
//
exports.Client = function(clientConfig) {
  var client = jayson.client.http({
    hostname: clientConfig.rpc.host,
    port: clientConfig.rpc.port
  });

  var Account = function(address, privateKey) {
    this.address = address;

    // This method has the same contract as the one in 'bitcoin-nanopayment.js'
    this.requestVoucher = function(inverseProbability, fromAddress, cb) {
      client.request('requestVoucher', [address, inverseProbability, fromAddress], function(err, error, response) {
        if(err) {
          cb(err);
          return;
        }
        if(error) {
          cb(error);
          return;
        }
        cb(error, response);
      });
    };

    // This method has the same contract as the one in 'bitcoin-nanopayment.js'
    this.createVoucher = function(destinationAddress, targetSerialized, cb) {
      client.request('createVoucher', [address, destinationAddress, targetSerialized], function(err, error, response) {
        if(err) {
          cb(err);
          return;
        }
        if(error) {
          cb(error);
          return;
        }
        cb(error, response);
      });
    };

    // This method has the same contract as the one in 'bitcoin-nanopayment.js'
    this.cashVoucher = function(transactionHex, cb) {
      client.request('cashVoucher', [address, transactionHex], function(err, error, response) {
        if(err) {
          cb(err);
          return;
        }
        if(error) {
          cb(error);
          return;
        }
        cb(error, response);
      });
    };
  };

  // This method has the same contract as the one in 'bitcoin-nanopayment.js'
  this.getAccount = function(address, privateKey, cb) {
    // Wait for a client to be created on the server create a client
    client.request('createAccount', [address, privateKey], function(err, error, response) {
      if(err) {
        cb(err);
        return;
      }
      if(error) {
        cb(error);
        return;
      }
      
      var account = new Account(address, privateKey);
      cb(null, account);
    });
  };
};
