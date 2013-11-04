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

// TODO: connect to custom port and IP
// TODO: document
exports.Account = function(client, rpcConfig, address, privateKey, timeout, minConf) {
  this.address = address;

  this.requestVoucher = function(inverseProbability, fromAddress, cb) {
    console.log(inverseProbability, fromAddress);
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

exports.getAccount = function(rpcConfig, address, privateKey, timeout, minConf, cb) {
  var client = jayson.client.http({
    port: 3000,
    hostname: 'localhost'
  });

  // create a client
  client.request('createAccount', [rpcConfig, address, privateKey, timeout, minConf], function(err, error, response) {
    if(err) {
      cb(err);
      return;
    }
    if(error) {
      cb(error);
      return;
    }

    var account = new exports.Account(client, rpcConfig, address, privateKey, timeout, minConf);
    cb(null, account);
  });
};
