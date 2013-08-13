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
var base58 = require('./base58');
var BigInteger = require('./jsbn-patched').BigInteger;

// External imports
var assert = require('assert');

// Test Base 58 encoding and decoding functionality

// Make sure the encode and decode are inverses
{
  var start = [0x00, 0x77, 0x88];
  var encoded = base58.encode(start);
  console.log(encoded);
  var decoded = base58.decode(encoded);
  console.log(decoded);
  assert(new Buffer(start).equals(new Buffer(decoded)));
}

// Test example from:
// https://en.bitcoin.it/wiki/Technical_background_of_version_1_Bitcoin_addresses
{
  var checked = '16UwLL9Risc3QfPqBUvKofHmBQ7wMtjvM';
  var decoded = base58.decodeChecked(checked);
  assert.equal(decoded.version, 0);
  assert.equal(
    decoded.payload.toString('hex'),
    '010966776006953d5567439e5e39f86a0d273bee'
  );
}
