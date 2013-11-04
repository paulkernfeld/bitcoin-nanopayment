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
var rpcClient = require('../lib/rpc-client');
var rpcServer = require('../lib/rpc-server');

var testPayment = require('../lib/test-payment');

// External imports
var async = require('async');
var assert = require('assert');
var fs = require('fs');

// This test creates two accounts in the user's wallet, and sends a nanopayment
// from "source" to "destination".

// Load configs
var rpcConfigText = fs.readFileSync('config/rpc.json', 'utf8');
var rpcConfig = JSON.parse(rpcConfigText);
var accountConfigText = fs.readFileSync('config/test-accounts.json', 'utf8');
var accountConfig = JSON.parse(accountConfigText);

// Send a transaction from the source address to the destination address
{
  async.waterfall([
    function(cb) {
      rpcServer = new rpcServer.Server();
      rpcServer.listen(cb);
    },

    function(cb) {
      // Make two new accounts
      rpcClient.getAccount(
        rpcConfig,
        accountConfig.sourceAddress,
        accountConfig.sourcePrivateKey,
        1000,
        0,
        cb
      );
    },
    
    function(sourceAccount, cb) {
      // We can ignore the callback      
      rpcClient.getAccount(
        rpcConfig,
        accountConfig.destinationAddress,
        accountConfig.destinationPrivateKey,
        1000,
        0,
        function(err, destinationAccount) {
          testPayment.test(sourceAccount, destinationAccount);
        }
      );
    }
  ]);
}
