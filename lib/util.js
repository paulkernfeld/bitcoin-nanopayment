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

// External imports
var assert = require('assert');
var crypto = require('crypto');

// This file is just miscellaneous helper functions

//
// Generates a random number between 0 and n - 1, inclusive.
//
// TODO: use all the bits, keep leftover unused bits
//
exports.cryptoRandom = exports.cryptoRandom = function(n) {
  assert(n > 0);

  // How many random bytes do we need?
  // We need:   8 ^ nBytes >= n
  for(var nBytes = 0; Math.pow(8, nBytes) < n; nBytes++);

  var random;

  // Use rejection sampling
  do {
    var randomBi = new BigInteger();
    randomBi.fromString(crypto.randomBytes(nBytes).toString('hex'), 16);
    random = parseInt(randomBi.toString(10))
  } while (random >= n);

  return random;
};


///Verify that this variable is an integer
exports.isInt = function(n) {
   return typeof n === 'number' && n % 1 == 0;
};

// Verify that this variable is a Bitcoin address
//
// TODO: Make this more specific
exports.isAddress = function(a) {
  return typeof a === 'string';
};

// Verify that this variable is a Bitcoin private key
//
// TODO: Make this more specific
exports.isPrivateKey = function(pk) {
  return typeof pk === 'string';
};
