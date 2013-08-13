'use strict';

// Internal imports
var BigInteger = require('./jsbn-patched').BigInteger;

// External imports
var crypto = require('crypto');
var assert = require('assert');
var buffertools = require('buffertools');

var alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
var validRegex = /^[1-9A-HJ-NP-Za-km-z]+$/;
var base = new BigInteger();
base.fromInt(58);


/**
 * Convert a byte array to a base58-encoded string.
 *
 * Written by Mike Hearn for BitcoinJ.
 *   Copyright (c) 2011 Google Inc.
 *
 * Ported to JavaScript by Stefan Thomas.
 *
 * Edited slightly by Paul Kernfeld
 */
exports.encode = function (input) {
  var bi = BigInteger.fromByteArrayUnsigned(input);
  var chars = [];

  while (bi.compareTo(base) >= 0) {
    var mod = bi.mod(base);
    chars.unshift(alphabet[mod.intValue()]);
    bi = bi.subtract(mod).divide(base);
  }
  chars.unshift(alphabet[bi.intValue()]);

  // Convert leading zeros too.
  for (var i = 0; i < input.length; i++) {
    if (input[i] == 0x00) {
      chars.unshift(alphabet[0]);
    } else break;
  }

  return chars.join('');
};

/**
 * Convert a base58-encoded string to a byte array.
 *
 * Written by Mike Hearn for BitcoinJ.
 *   Copyright (c) 2011 Google Inc.
 *
 * Ported to JavaScript by Stefan Thomas.
 *
 * Edited slightly by Paul Kernfeld
 */
exports.decode = function (input) {
  var bi = new BigInteger();
  bi.fromInt(0);
  var leadingZerosNum = 0;
  for (var i = input.length - 1; i >= 0; i--) {
    var alphaIndex = alphabet.indexOf(input[i]);
    if (alphaIndex < 0) {
      throw "Invalid character";
    }
    var ai = new BigInteger();
    ai.fromInt(alphaIndex);
    bi = bi.add(ai.multiply(base.pow(input.length - 1 -i)));
    
    // This counts leading zero bytes
    if (input[i] == "1") leadingZerosNum++;
    else leadingZerosNum = 0;
  }
  var bytes = bi.toByteArrayUnsigned();
  
  // Add leading zeros
  while (leadingZerosNum-- > 0) bytes.unshift(0);
  
  return bytes;
};

// The input should be a buffer and a version byte
// https://en.bitcoin.it/wiki/Base58Check_encoding
exports.encodeChecked = function(input, version) {
  // todo: maybe we implement this...
};

// Copyright 2013 Paul Kernfeld
// Return (hex, version byte)
exports.decodeChecked = function(input) {
  var buffer = new Buffer(exports.decode(input));
  assert(
    buffer.length > 5,
    input + ' is too short to be a Base58-checked string'
  );
  var withoutChecksum = buffer.slice(0, -4);
  var hash1 = crypto.createHash('sha256');
  hash1.update(withoutChecksum);
  var hash2 = crypto.createHash('sha256');
  hash2.update(hash1.digest());
  var checksumExpected = hash2.digest().slice(0, 4);
  var checksumActual = buffer.slice(-4);
  assert(
    checksumExpected.equals(checksumActual),
    'Checksum was ' + checksumActual.toString('hex') +
      ', should be ' + checksumExpected.toString('hex')
  );
  return {
    payload: withoutChecksum.slice(1),
    version: withoutChecksum[0]
  };
};
