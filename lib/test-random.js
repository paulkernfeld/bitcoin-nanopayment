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
var paymentBtc = require('./util');

// External imports
var assert = require('assert');

// Horribly weak visual test for random number generation
{
  var testUniformRandom = function(n) {
    for(var i = 0; i < 100; i++) {
      var random = paymentBtc.cryptoRandom(n);
      assert(random >= 0);
      assert(random < n);
      console.log(random)
    }
  };

  var ns = [1, 3, 8, 256, 1000];

  for (var n in ns) {
    testUniformRandom(ns[n]);
  }
}
