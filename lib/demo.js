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
var paymentBtc = require('./payment-btc');
var Account = paymentBtc.Account;

// External imports
var repl = require('repl');
var assert = require('assert');
var colors = require('colors');

// The account object we'll be using
var account;


// I couldn't find a suitable repl parser. I swear I tried.
//
// TODO: this is gross
var simpleParse = function(template, split) {

  // Generate a message describing the usage of this command
  var usage = '\nUsage:\n';
  for (var i = 0; i < template.length; i += 2) {
    usage += template[i] + ' ';
  }
  usage += '\n\n';
  for (var i = 0; i < template.length; i += 2) {
    usage += template[i] + ' - ' + template[i + 1] + '\n';
  }

  assert(
    template.length === split.length * 2,
    'Wrong number of arguments' + usage
  );

  // Jam the args into a JSON object
  var parsed = {};
  for (var i = 1; i < split.length; i++) {
    parsed[template[i * 2]] = split[i];
  };

  return parsed;
};


// Use a specific account
var useAccount = function(split, cb) {
  var template = [
    'use', 'This command uses a given address to make and receive payments',
    'address', 'The address (public key) for your address',
    'privateKey', 'The private key for your address'
  ];
  
  var args = simpleParse(template, split);

  var rpcConfig = {
    "host": "localhost",
    "port": 18332,
    "user": "mrkittens",
    "pass": "meowmeow"
  };
  var timeout = 0;
  var minConf = 0;

  account = new Account(
    rpcConfig,
    args.address,
    args.privateKey,
    timeout,
    minConf
  );

  account.initialize(cb);
};


// Request a voucher
var requestVoucher = function(split, cb) {
  var template = [
    'request',
    'This generates a payment request to send to another party',
    'inverseProbability',
    '1 divided by the probability of this voucher being cashable',
    'fromAddress',
    'The address from which to request a voucher'
  ];
  var args = simpleParse(template, split);

  var inverseProbability = parseInt(args.inverseProbability);

  assert(account, 'Account must be set using the "use" command.');

  account.requestVoucher(inverseProbability, args.fromAddress, cb);
};


// Create a voucher
var createVoucher = function(split, cb) {
  var template = [
    'create', 'This creates a payment from this address to someone else',
    'destinationAddress', 'The address to pay the money to',
    'targetSerialized', 'The serialized target to pay the money to'
  ];
  var args = simpleParse(template, split);

  assert(account, 'Account must be set using the "use" command.');

  account.createVoucher(args.destinationAddress, args.targetSerialized, cb);
};


// Cash in a voucher
var cashVoucher = function(split, cb) {
  var template = [
    'cash', 'This command attempts to cash in a voucher from another party',
    'transactionHex', 'The hex-encoded transaction'
  ];
  var args = simpleParse(template, split);

  assert(account, 'Account must be set using the "use" command.');

  account.cashVoucher(args.transactionHex, cb);
};

// Run the user's command
var replEval = function(cmd, context, filename, cb) {

  // Parse the input
  var split = cmd.slice(1, -2).split(' ');
  var command = split[0];

  // Format the result of the callback
  function formatCb(err, result) {
    if (err) {
      cb(err.toString().red);
    } else if (result) {
      cb(result.toString().green);
    } else {
      cb('Success'.green);
    };
  };

  // Wrap everything in this big ol' try block to catch errors without exiting
  try {
    // Redirect to the right function for processing the input
    if (command == 'use') {
      useAccount(split, formatCb);
    } else if (command == 'request') {
      requestVoucher(split, formatCb);
    } else if (command == 'create') {
      createVoucher(split, formatCb);
    } else if (command == 'cash') {
      cashVoucher(split, formatCb);
    } else {
      formatCb(
        'Command not recognized.  Commands are: use, request, create, and cash'
      );
    }
  } 

  // When we get an error, don't die, just print it to the console
  catch (err) {
    formatCb(err);
  }
};

// Run the repl
repl.start({
  prompt: "node via stdin> ",
  eval: replEval
});
