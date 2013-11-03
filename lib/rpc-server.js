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
exports.Server = function(rpcConfig, address, privateKey, timeout, minConf) {

  var serverRunning;
  var accounts = [];

  // create a server
  var server = jayson.server({

    // Returns an arbitrary numeric ID for this account
    createAccount: function(rpcConfig, address, privateKey, timeout, minConf, cb) {
      try {
        accounts += [new Account(rpcConfig, address, privateKey, timeout, minConf)];
      } catch (e) {
        cb(e);
      }
      cb(null, accounts.length - 1);
    },

    requestVoucher: function(accountId, inverseProbability, fromAddress, cb) {
      try {
        accounts[accountId].requestVoucher(inverseProbability, fromAddress, cb);
      } catch (e) {
        cb(e);
      }
    },

    createVoucher: function(accountId, destinationAddress, targetSerialized, cb) {
      try {
        accounts[accountId].createVoucher(destinationAddress, targetSerialized, cb);
      } catch (e) {
        cb(e);
      }
    },

    cashVoucher: function(accountId, transactionHex, cb) {
      try {
        accounts[accountId].cashVoucher(transactionHex, cb);
      } catch (e) {
        cb(e);
      }
    }
  });

  // Bind a http interface to the server and let it listen to localhost:3000
  this.listen = function() {
    serverRunning = server.http().listen(3000);
  }

  this.close = function() {
    serverRunning.close();
  }
};
