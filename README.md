<---
This file is part of bitcoin-nanopayment

bitcoin-nanopayment is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

bitcoin-nanopayment is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with bitcoin-nanopayment.  If not, see <http://www.gnu.org/licenses/>.
--->



bitcoin-nanopayment
===================
Copyright 2013 Paul Kernfeld.  This software is released under the [GNU GPL v3][gpl].

bitcoin-nanopayment is a node.js library that allows users to send probabilistc nanopayments to others.  It uses RPC calls to Bitcoin-Qt to create, verify, and "cash in" payments.  This library is an implementation of [this probabilistic nanopayment strategy][nanopayments] first [proposed][proposal] by [casascius][casascius] and [jevon][jevon].


Probabilistic Nanopayments
--------------------------

### What are probabilistic nanopayments?
Alice needs to pay Bob half a cent.  In order to pay Bob the equivalent of half a cent, she flips a coin.  If it's heads, she pays him one cent.  If it's tails, she pays him nothing.  In the long term, these payments even out.

This library lets users create "vouchers," which are bitcoin transactions that have a known probability of succeeding.  Instead of paying 1 mBTC, the user can send a voucher that has a 10% chance of being worth 10 mBTC, and 90% of the time doesn't do anything.

### Who is this for?
This protocol is useful for entities that need to send or receive small or rapid Bitcoin payments.

### Small payments
Sending extremely small Bitcoin payments is impractical, because each transaction takes up space in the blockchain.  Currently, the reference implementation discourages this by charging [transaction fees][fees] for transactions smaller than 0.01 BTC and refusing to relay transactions of less than 5430 Satoshis ("dust") by default.

This protocol even lets users pay each other quantities less than 1 Satoshi.

This protocol is not to be confused with a [Bitcoin micropayments channel][micropayments], which allows two users to group many small transactions between themselves into a larger transaction.

### Rapid payments
An entity that sends rapid payments needs to have a lot of money in its account.  Otherwise, it must wait until each new block to send another transaction.  Probabilistic nanopayments avoid this problem because they can pay the same amount of money with fewer transactions.


Properties
----------
### Double-spending
This is equally vulnerable to double-spend attacks as ordinary Bitcoin transactions

### Asymptotic Guarantees
For *N* vouchers, each for *x* BTC and being cashable with a probability *p,* the distribution of payments made follows a binomial distribution with parameters *N* and *p,* scaled by *x.*  The scaled distribution has mean *xNp* and variance *x*√(*Np*(1 - *p*)).

The Poisson approximation to the binomial distribution is appropriate when *p* is small and *N* is large. In this case the returns are approximated by a Poisson distribution with parameter *Np*, scaled by *x*.

The normal approximation of the binomial distribution is appropriate when *Np* >> 1.  In this case, the returns are approximated by normal distribution with mean *xNp* and standard deviation *x*√(*Np*).

The ratio of actual returns to expected returns is a distribution with mean 1 and standard deviation less than 1/√(*Np*).

### Limitations
#### Of nanopayments
* This system requires the recipient to hold the private key for the account that's being paid to

#### Of this protocol
* Payment requires several round trips between the payer and payee
* The payee must have a small amount of money to get paid
* The rate at which the payee can be paid depends on how much money the payee has
* The payee can be DDoS'ed unless he is able to filter out illegitimate payment requests
* Paying and being paid can't be done simultaneously

#### Of this implementation
* Requires use of Bitcoin-Qt's RPC functionality
* This is hardcoded to only send transactions for 0.01 BTC
* Can only send or receive one transaction at a time
* Hardcoded to use testnet bitcoins

Setup
-----
### Bitcoin-Qt setup
In order to use this library, you must install [Bitcoin-Qt][bitcoin-qt] and enable RPC.

Create or modify Bitcoin-Qt's [`bitcoin.conf`][bitcoin-conf] file to enable the RPC server.  Set `testnet` to `1` only if you're using the testnet.  Be aware that this lets any program that can read this password have access to your Bitcoin wallet.  *THIS IS A BAD IDEA.*

    testnet=1

    rpcuser=admin
    rpcpassword=12345
    server=1


How to Use
----------
Alice pays Bob as follows:

### Step 1
Bob requests a payment from Alice by calling the `requestPayment` method.  He sends the result of this method (the "target") to Alice.

### Step 2
Alice creates a voucher based on the this by calling 'createPayment' and passing in the target.  She sends the voucher to Bob.

### Step 3
Bob calls 'cashPayment' on the voucher he just received from Alice.  The result of this method tells him whether the payment was valid, and whether or not it was cashable.


You can simulate this process by running two instances of `demo.js` and sending a voucher from one to the other.



[gpl]: http://www.gnu.org/licenses/gpl.html
[nanopayments]: https://en.bitcoin.it/wiki/Nanopayments "The Bitcoin wiki's explanation of the probabilistic nanopayment protocol"
[proposal]: https://bitcointalk.org/index.php?topic=62558.msg836758#msg836758
[casascius]: https://www.casascius.com/
[jevon]: https://twitter.com/jevon
[micropayments]: https://en.bitcoin.it/wiki/Contracts#Example_7:_Rapidly-adjusted_.28micro.29payments_to_a_pre-determined_party "The Bitcoin wiki's explanation of the rapidly-adjected micropayment channel protocol"
[fees]: https://en.bitcoin.it/wiki/Transaction_fees "The Bitcoin wiki's summary of transaction fees"
[bitcoin-qt]: http://bitcoin.org/en/download "Download Bitcoin-Qt"
[bitcoin-conf]: https://en.bitcoin.it/wiki/Running_Bitcoin#Bitcoin.conf_Configuration_File  "The Bitcoin wiki's intro to bitcoin.conf files"