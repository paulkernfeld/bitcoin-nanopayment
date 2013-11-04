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
var Account = nanopayments.Account;

// External imports
var jayson = require('jayson');
var assert = require('assert');

// TODO: comment
// TODO: take custom port
// TODO: 
exports.Server = function(rpcConfig, address, privateKey, timeout, minConf) {

  var serverRunning;
  var accounts = {};

  // create a server
  var server = jayson.server({

    // Returns an arbitrary numeric ID for this account
    createAccount: function(rpcConfig, address, privateKey, timeout, minConf, cb) {
      try {
        accounts[address] = new Account(rpcConfig, address, privateKey, timeout, minConf);
      } catch (e) {
        cb(e);
        return;
      }
      cb(null);
    },

    requestVoucher: function(accountAddress, inverseProbability, fromAddress, cb) {
      console.log(accountAddress, inverseProbability, fromAddress);
      accounts[accountAddress].requestVoucher(inverseProbability, fromAddress, cb);
    },

    createVoucher: function(accountAddress, destinationAddress, targetSerialized, cb) {
      accounts[accountAddress].createVoucher(destinationAddress, targetSerialized, cb);
    },

    cashVoucher: function(accountAddress, transactionHex, cb) {
      accounts[accountAddress].cashVoucher(transactionHex, cb);
    }
  });

  // Bind a http interface to the server and let it listen to localhost:3000
  // Only allow connections from localhost
  // cb takes only the error
  this.listen = function(cb) {
    var cbWrapper = function(err, listening) {
      cb(err);
    };
    serverRunning = server.http().listen(3000, 'localhost', cbWrapper);
  }

  this.close = function() {
    serverRunning.close();
  }
};
