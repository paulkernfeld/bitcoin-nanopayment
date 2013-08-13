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
var BigInteger = require('./jsbn-patched').BigInteger;

// External imports
var assert = require('assert');
var fs = require('fs');
var bitcoin = require('bitcoin');
var async = require('async');

// This test creates two accounts in the user's wallet, and sends a nanopayment
// from one to the other.

// Load configs
var rpcConfigText = fs.readFileSync('config/rpc.json', 'utf8');
var rpcConfig = JSON.parse(rpcConfigText);
var accountConfigText = fs.readFileSync('config/test-accounts.json', 'utf8');
var accountConfig = JSON.parse(accountConfigText);

// Send a transaction from the source address to the destination address
{
  // Make two new accounts
  var sourceAccount = new Account(
    rpcConfig,
    accountConfig.sourceAddress,
    accountConfig.sourcePrivateKey,
    1000,
    0
  );

  var destinationAccount = new Account(
    rpcConfig,
    accountConfig.destinationAddress,
    accountConfig.destinationPrivateKey,
    1000,
    0
  );

  var client = new bitcoin.Client(rpcConfig);

  var destinationAddress = accountConfig.destinationAddress;

  async.waterfall([
    // Initialize each account
    function(cb) {
      sourceAccount.initialize(function(err) {
        assert.ifError(err, 'Error initializing source account');
        console.log('Source account initialized.');
        cb(err);
      });
    },

    function(cb) {
      destinationAccount.initialize(function(err) {
        assert.ifError(err, 'Error initializing destination account');
        console.log('Destination account initialized.');
        cb(err);
      });
    },

    // The recipient requests the payment
    function(cb) {
      destinationAccount.requestVoucher(
        1,
        accountConfig.sourceAddress,
        function(err, targetSerialized) {
          assert.ifError(err, 'Error requesting voucher');
          console.log('Voucher requested.');

          var target = nanopayments.deserializeTarget(targetSerialized);

          // Make sure the length of the range is 1
          assert.equal(target.length, 1);
          cb(err, targetSerialized);
        });
    },

    // The payer creates the payment voucher based on the request
    function(range, cb) {
      sourceAccount.createVoucher(
        destinationAddress,
        range,
        function(err, transactionHex) {
          assert.ifError(err, 'Error creating voucher');
          console.log('Voucher created.');
          cb(err, transactionHex);
        }
      );
    },

    // The recipient cashes the payment voucher in
    function(transactionHex, cb) {
      destinationAccount.cashVoucher(transactionHex, function(err, cashed) {
        assert.ifError(err, 'Error cashing voucher');
        assert(cashed);
        console.log('Transaction cashed.');
      });
    }
  ]);
}
