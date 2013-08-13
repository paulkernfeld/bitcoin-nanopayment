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

// Internal import
var base58 = require('./base58');

// This is just a stub file for generating standard pay-to-public-key-hash
// transactions

// Standard tx: https://en.bitcoin.it/wiki/Transactions#Pay-to-PubkeyHash
// Bitcoin Script: https://en.bitcoin.it/wiki/Script
exports.addressToScript = function(addressHex) {
  var scriptStart = '76a914';
  var scriptEnd = '88ac';
  return scriptStart + addressHex + scriptEnd;
};

Object.freeze(exports);
