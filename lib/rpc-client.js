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

exports.RpcAccount = function(rpcConfig, address, privateKey, timeout, minConf) {

  var accountRpdId;

  // create a client
  var client = jayson.client.http({
    port: 3000,
    hostname: 'localhost'
  });

  client.request('createAccount', [rpcConfig, address, privateKey, timeout, minConf], function(err, error, response) {
    if(err) throw err;
    if(error) throw error;
    accountRpcId = response;
  });

  this.requestVoucher = function(inverseProbability, fromAddress, cb) {
    client.request('requestVoucher', [accountRpcId, inverseProbability, fromAddress], function(err, error, response) {
      if(err) throw err;
      cb(error, response);
    });
  };

  this.createVoucher = function(inverseProbability, fromAddress, cb) {
    client.request('createVoucher', [accountRpcId, accountId, destinationAddress, targetSerialized], function(err, error, response) {
      if(err) throw err;
      cb(error, response);
    });
  };

  this.cashVoucher = function(accountId, transactionHex, cb) {
    client.request('cashVoucher', [accountRpcId, inverseProbability, fromAddress], function(err, error, response) {
      if(err) throw err;
      cb(error, response);
    });
  };
};
