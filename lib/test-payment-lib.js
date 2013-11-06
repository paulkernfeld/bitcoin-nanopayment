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
var testPayment = require('../lib/test-payment');
var Account = nanopayments.Account;

// External imports
var assert = require('assert');
var fs = require('fs');

// Load configs
var bitcoindConfigText = fs.readFileSync('config/bitcoind.json', 'utf8');
var bitcoindConfig = JSON.parse(bitcoindConfigText);
var accountConfigText = fs.readFileSync('config/test-accounts.json', 'utf8');
var accountConfig = JSON.parse(accountConfigText);

// Send a transaction from the source address to the destination address
{
  // Make two new accounts
  var sourceAccount = new Account(
    bitcoindConfig,
    accountConfig.sourceAddress,
    accountConfig.sourcePrivateKey,
    1000,
    0
  );

  var destinationAccount = new Account(
    bitcoindConfig,
    accountConfig.destinationAddress,
    accountConfig.destinationPrivateKey,
    1000,
    0
  );

  testPayment.test(sourceAccount, destinationAccount);
}
