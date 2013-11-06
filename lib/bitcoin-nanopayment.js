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
var BigInteger = require('./jsbn-patched').BigInteger;
var base58 = require('./base58');
var script = require('./script');
var util = require('./util');

// External imports
var bitcoin = require('bitcoin');
var async = require('async');
var assert = require('assert');

// Satoshis per Bitcoin.  All math is done in Satoshis to avoid rounding errors.
var SATOSHIS = 100000000.;

// Hard-code the amount to pay for now (0.01 Bitcoins)
var AMOUNT = 1000000;

// 10 seconds should be plenty of time to round-trip a voucher request
var DEFAULT_TIMEOUT = 10000;

// The version byte for testnet public addresses
var TESTNET_PUBLIC_VERSION = 111;

// How many possible txid's are there?  32 bytes = 16 ^ 64
var TXID_RANGE_BI = new BigInteger();
TXID_RANGE_BI.fromString('10000000000000000000000000000000000000000000000000000000000000000', 16);


// Turn the target into a serialized, URL-safe string
//
// TODO: this should just take a JSON object, jeez
var serializeTarget = exports.serializeTarget =
  function(amount, length, vout, start) {
    return amount + '-' + length + '-' + vout + '-' + start;
  };

// Convert this serialized target into a JS object representing the target
var deserializeTarget = exports.deserializeTarget = function(target) {
  assert(typeof target === 'string', 'target must be a string');

  var split = target.split('-');
  assert(
    split.length === 4,
    'target has ' + split.length + ' values, should have 4'
  );
  return {
    amount: parseInt(split[0]),
    length: parseInt(split[1]),
    vout: parseInt(split[2]),
    start: split[3]
  };
};


// This object encapsulates logic to request, send, and cash in vouchers.
// Currently, it uses only one Bitcoin address.
exports.Account = function(rpcConfig, address, privateKey, timeout, minConf) {

  // Set default values
  timeout = typeof timeout === 'undefined' ? DEFAULT_TIMEOUT : timeout;
  minConf = typeof minConf === 'undefined' ? 1 : minConf;

  // Verify argument types
  assert(util.isAddress(address), 'address must be a valid Bitcoin address');
  assert(
    util.isPrivateKey(privateKey),
    'privatekey must be a valid private key'
  );
  assert(typeof timeout == 'number', 'timeout must be a number');
  assert(util.isInt(minConf), 'minConf must be an integer');

  // Convert the address into hex representation
  var addressBinary = base58.decodeChecked(address);
  assert.equal(addressBinary.version, TESTNET_PUBLIC_VERSION);
  var addressHex = addressBinary.payload.toString('hex');

  var client = new bitcoin.Client(rpcConfig);

  // The target allows us to validate and cash incoming vouchers.  It contains
  // information about the range of txid's that may be guessed, and the hex
  // transaction we'll submit if we cash an incoming voucher.
  //
  // {
  //   start: BigInteger,
  //   length: integer,
  //   offset: integer,
  //   transactionHex: hex string
  // }
  //
  // If this is null, no incoming voucher is valid
  var currentTarget = null;
  
  // This queue is basically just a lock, so it's always called with a
  // concurrency of 1.  The purpose is to prevent us from doing two operations
  // at the same time, e.g. double spending.
  var queue;
  queue = async.queue(
    function (task, cb) { task(cb); },
    1
  );

  
  //
  // This must be finished running before using this account can be used.
  // This function initializes the account by looking up the previous unspent
  // transactions into this address.  These are necessary because we're creating
  // raw transactions, for which we need txid's
  // of previous transactions.
  //
  // TODO: verify that the private key matches the public key
  //
  // 
  // When this finishes, it calls cb(err, previous).  previous is:
  // {
  //   balance: [int, in Satoshis],
  //   txid: [hex string],
  //   vout: [integer]   
  // }
  //   
  var getPrevious = function(cb) {
    var balance = null;
    var previousTxid;
    var previousVout;

    // Retrieve the txid of the most recent tx into my account
    client.cmd(
      'listunspent',
      minConf,
      999999,
      [address],
      function(err, transactions) {
        if(err) {
          cb(err);
          return;
        }
        
        // Select the largest unspent output.
        //
        // TODO: Add the ability to combine multiple outputs.
        for (var i in transactions) {
          var transactionAmount =
            Math.round(transactions[i].amount * SATOSHIS);
          if (balance === null ||
              transactionAmount > balance) {
            previousTxid = transactions[i].txid;
            previousVout = transactions[i].vout;
            balance = transactionAmount;
          }
        }
        
        if(balance < AMOUNT) {
          cb("You don't have enoungh Bitcoins.  You need at least " + AMOUNT +
             ' Satoshis to use this, you only have ' + balance);
        } else if (balance === null) {
          cb(
            'No unspent transactions found.  ' +
              'Maybe there is an unconfirmed transaction to this address?');
        } else {
          cb(null, {
            balance: balance,
            txid: previousTxid,
            vout: previousVout
          });
        }
      }
    );
  };

  //
  // Produce a voucher request which specifies the range of acceptable txid's
  // to pay to.
  //
  // - inverseProbability - int, the probability of the voucher being cashable,
  //     to the -1 power
  // - fromAddress - the Base58-encoded address from which to request voucher
  //
  // After calling this, we wait for a period of time before doing any more
  // voucher operations because doing other operations may invalidate the
  // target.  After the period of time has expired, we unlock the queue so that
  // we can continue processing other operations.
  //
  // On failure, call cb(error)
  // 
  // On success, call cb(null, target) where target is a serialized target
  //
  // The serialized target can be sent to the payer.
  //
  this.requestVoucher = function(inverseProbability, fromAddress, cb) {

    assert(
      util.isInt(inverseProbability),
      'inverseProbability must be an integer'
    );
    assert(inverseProbability >= 1, 'inverseProbability must be >= 1');
    assert(util.isAddress(fromAddress), 'fromAddress must be a string');

    // This is a separate fn so that we can push it onto the queue
    var requestVoucher = function(queueCb) {

      async.waterfall([

        // Get the previous transaction info
        getPrevious,

        // Create the transaction
        function(previous, waterfallCb) {

          // We pay the amount for the transaction to the counterparty and send
          // the change to ourselves. This is backwards, yes, but we need this
          // to generate our secret txid. Don't worry, we're not actually
          // submitting this to the Bitcoin network yet.
          var outputs = {};
          outputs[fromAddress] = AMOUNT / SATOSHIS;

          // We need to send change to ourself iff there's money left over
          //
          // TODO: pull this functionality out
          if (previous.balance > AMOUNT) {
            outputs[address] = (previous.balance - AMOUNT) / SATOSHIS;
            assert.equal(
              Math.round((outputs[fromAddress] + outputs[address]) * SATOSHIS),
              previous.balance,
              'Balance rounding error!?'
            );
          }

          client.cmd(
            'createrawtransaction',
            [{'txid': previous.txid, 'vout': previous.vout}],
            outputs,
            waterfallCb
          );
        },


        // Sign the transaction
        function(transactionHex, waterfallCb) {
          client.cmd('signrawtransaction', transactionHex, waterfallCb);
        },


        // Decode the signed transaction
        function(signed, waterfallCb) {
          // Make sure Bitcoin-QT signed the transaction properly.
          //
          // TODO: would this ever fail?
          if (!signed.complete) {
            waterfallCb('Setup transaction not complete');
            return;
          }

          client.cmd(
            'decoderawtransaction',
            signed.hex,
            function(err, transactionJson) {
              waterfallCb(err, signed, transactionJson);
            }
          );
        },


        // Store the decoded transaction
        function(signed, transactionJson, waterfallCb) {

          // This is just a sanity check specific to this implementation
          assert(
            transactionJson.vout.length == 1 ||
              transactionJson.vout.length == 2,
            'Unexpected number of vouts'
          );

          var txid = transactionJson.txid;

          // The start of the target range is the txid minus a random offset
          var offset = util.cryptoRandom(inverseProbability);
          var offsetBi = new BigInteger();
          offsetBi.fromInt(offset);
          var startBi = new BigInteger();
          startBi.fromString(txid, 16);
          startBi = startBi.subtract(offsetBi).mod(TXID_RANGE_BI);

          // Store the target as a JSON object.  We OVERWRITE the previous
          // target -- it's now invalid.  Why?  If we received a cashable
          // voucher for each target, we couldn't cash both.  So, we can only
          // have one target open at a time.
          currentTarget = {
            start: startBi,
            length: inverseProbability,
            offset: offset,
            transactionHex: signed.hex
          };

          // Success
          var target = serializeTarget(
            AMOUNT,
            currentTarget.length,
            0,
            startBi.toString(16)
          );
          waterfallCb(null, target);

          // Wait for a little before we free up the queue.  This gives use a
          // time window to get paid before we being our next operation.
          setTimeout(queueCb, timeout);
        }
      ], cb);
    };

    // The function that gets run when this gets popped off the queue is
    // actually a no-op.  We manually call cb from inside the queued function,
    // so it's fine.
    queue.push(requestVoucher, function() {});
  };


  //
  // Create a voucher.
  //
  // - destinationAddress: the Base58-encoded address to which to pay the money
  // - target, a serialized target
  // 
  // On failure, we call cb(error)
  // On success, we call cb(null, transactionHex)
  //
  this.createVoucher = function(destinationAddress, targetSerialized, cb) {

    // Check the inputs
    assert(util.isAddress(destinationAddress));
    
    // Decode the target.  If we get an error, the target is invalid.
    var target;
    try {
      target = deserializeTarget(targetSerialized);
    } catch (err) {
      cb('Error deserializing target: ' + err);
      return;
    }

    // We only create vouchers for exactly AMOUNT Satoshis
    if (target.amount != AMOUNT) {
      cb('Transaction amount was ' + target.amount + ', must be ' + AMOUNT);
      return;
    }

    // We can't pay ourselves using this method
    if(destinationAddress == address) {
      cb(
        'The paying address may not be the same as the destination address');
      return;
    }


    // This is a separate fn so we can push it onto the queue
    var createVoucher = function(queueCb) {

      async.waterfall([

        // Get my previous tx info and balance
        getPrevious,

        // Ask the client to create this transaction.  This doesn't actually send anything, it just
        // creates a binary string representing the transaction.
        function(previous, waterfallCb) {
          // Make sure we have enough money
          if(AMOUNT > previous.balance) {
            cb('Need ' + AMOUNT + ', only have ' + previous.balance);
            return;
          }
          
          // Our payment to the destination is the actual voucher.  We must also return the money paid
          // in the original transaction back to the payee.  So, we pay double the amount to the
          // destination address
          var outputs = {};
          outputs[destinationAddress] = AMOUNT * 2 / SATOSHIS;
          
          // We need to send change to ourself iff there's money left over
          if (AMOUNT < previous.balance) {
            outputs[address] = (previous.balance - AMOUNT) / SATOSHIS;
            assert.equal(Math.round((outputs[destinationAddress] + outputs[address]) * SATOSHIS), previous.balance + AMOUNT);
          }
          
          // Randomly guess a number in the target range
          var targetStartBi = new BigInteger();
          targetStartBi.fromString(target.start, 16);
          var randomBi = new BigInteger();
          randomBi.fromInt(util.cryptoRandom(target.length));
          var previousTxidGuess = targetStartBi.add(randomBi).mod(TXID_RANGE_BI).toString(16);
          
          // Pad the guessed transaction ID with zeros
          while(previousTxidGuess.length < 64) {
            previousTxidGuess = '0' + previousTxidGuess;
          }

          var waterfallTranslator = function(err, transactionHex) {
            waterfallCb(err, transactionHex, previousTxidGuess);
          }

          client.cmd('createrawtransaction', [{'txid': previousTxidGuess, 'vout': target.vout}, {'txid': previous.txid, 'vout': previous.vout}], outputs, waterfallTranslator);
        },

        // The transaction was successfully created.  Now sign it.
          function(transactionHex, previousTxidGuess, waterfallCb) {
          var scriptPubKey = script.addressToScript(addressHex);

          client.cmd('signrawtransaction', transactionHex, [{'txid': previousTxidGuess,'vout': target.vout, 'scriptPubKey': scriptPubKey, 'redeemScript': privateKey}], waterfallCb);
        },

        // We signed the transaction, now invalidate the current target
        function(signed, waterfallCb) {
          // I think that this means that the transaction is potentially valid. TODO: verify
          assert(signed.complete);
          
          // Since we may send this voucher out and it's using the same prevout
          // as the current  target, we must declare the current target
          // invalid.
          currentTarget = null;
          
          waterfallCb(null, signed.hex);
        }
      ], queueCb);
    };

    queue.push(createVoucher, cb);
  };


  //
  // Cash in a voucher.
  //
  // - transactionHex: a voucher payable to me
  //
  // This doesn't need to be synchronized using the queue.
  //
  // If the voucher is invalid, call cb(err)
  // If the voucher is valid, call cb(null, cashed)
  //
  // cashed is a boolean indicating whether this transaction was cashed
  //
  this.cashVoucher = function(transactionHex, cb) {

    // verify the txid
    client.cmd('decoderawtransaction', transactionHex, function(err, transactionJson) {

      if(err) {
        cb('Error decoding transaction: ' + err);
        return;
      }

      // This checks the 0th output of the transaction, and makes sure that it is paid to an
      // address within the targetrange that we've specified.
      // TODO: remove this check by looping over vouts
      if (transactionJson.vout.length < 1) {
        cb('there must be at least one vout (there may be another to get change)');
        return;
      }

      // TODO: other vouts work too, maybe even add them up?
      // We expect double the amount, because we're getting back the amount we paid
      assert.equal(Math.round(transactionJson.vout[0]['value'] * SATOSHIS), AMOUNT * 2);

      var destinationAddress = transactionJson.vout[0].scriptPubKey.addresses[0];

      // This is the txid that the payer guessed
      var previousTxid = transactionJson.vin[0].txid;
      var previousTxidBi = new BigInteger();
      previousTxidBi.fromString(previousTxid, 16);

      // validate that toAddress isn't our own address
      if (destinationAddress != address) {
        cb('wrong destination address: is ' + destinationAddress + ', should be ' + address);
        return;
      }

      // If there's no target set up, we can't be paid
      if (!currentTarget) {
        cb('No target set up');
        return;
      }

      // previous txid is lower than this target, no good
      if (previousTxidBi.compareTo(currentTarget.start) < 0) {
        cb('txid too low');
        return;
      }

      // previous txid is higher than this target, no good
      var targetLength = new BigInteger();
      targetLength.fromInt(currentTarget.length);
      var targetEnd = currentTarget.start.add(targetLength);
      if (previousTxidBi.compareTo(targetEnd) >= 0) {
        cb('txid too high');
        return;
      }

      // Wrong guess. The voucher was valid but not cashable
      var targetOffset = new BigInteger();
      targetOffset.fromInt(currentTarget.offset);
      if (previousTxidBi.compareTo(currentTarget.start.add(targetOffset)) !== 0) {
        cb(null, false);

        // Destroy the target.  Otherwise the payer could re-guess with a higher probability of
        // correctness
        currentTarget = null;
        return;
      }

      //
      // The voucher was valid and cashable.  Cash it!  #getmoney
      //

      // First, submit the setup transaction
      client.cmd('sendrawtransaction', currentTarget.transactionHex, function(err, txid) {
        if(err) {
          // We couldn't submit the setup transaction?  Yuck.  Bitcoin-Qt closed, maybe?
          cb('Error sending setup transaction: ' + currentTarget.transactionHex + ' ' + err);
          return;
        }

        // Now that we've used this target, get rid of it
        currentTarget = null;

        // TODO: how do we tell the difference between invalid and uncashable if this call fails?
        client.cmd('sendrawtransaction', transactionHex, function(err, txid) {
          if(err) {
            cb('Error sending real transaction: ' + err);
          } else {
            cb(null, true);
          }
        });
      });
    });
  };
}

Object.freeze(exports);  
