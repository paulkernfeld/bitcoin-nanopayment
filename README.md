bitcoin-nanopayment
===================
Copyright 2013 Paul Kernfeld.  This software is released under the [GNU GPL v3][gpl].

bitcoin-nanopayment is a Node library that allows users to send probabilistic Bitcoin nanopayments to others.  It works on top of ordinary Bitcoin, and uses RPC calls to Bitcoin-Qt to create, verify, and "cash in" payments.  This library is an implementation of [this probabilistic nanopayment strategy][nanopayments] first [proposed][proposal] by [casascius][casascius] and [jevon][jevon].

### What are probabilistic nanopayments?
Alice wants to pay Bob half a cent.  In order to pay Bob the equivalent of half a cent, she first flips a coin.  If it's heads, she pays him one cent.  If it's tails, she pays him nothing.  In the long term, the luck evens out.

Probabilistic Nanopayments
--------------------------
### What does this library do?
bitcoin-nanopayment allows users to send probabilistic Bitcoin nanopayments to others.  The library can send and receive nanopayments into a user's Bitcoin-Qt wallet using the RPC API.  It lets users create "vouchers," which are Bitcoin transactions that have a known and verifiable probability of succeeding.

### How does this library work?
This library lets users request, generate, and cash in vouchers that succeed with probability 1 / *K*, where *K* ≥ 1 is an integer.  Otherwise, with probability (*K* - 1) / *K*, the voucher does nothing.  When sending a voucher for value *x* that succeeds with probability 1 / *K*, the monetary value of the voucher is *x* / *K*.  This library generates the vouchers, and the user is responsible for sending them between users.

Please see [docs/developers.md][docs/developers.md] for more details.

### Who is this for?
This protocol is useful for entities that need to send or receive Bitcoin payments that are small or rapid.  Although a simple CLI is provided, this will probably be more useful for automated payments by applications.

### Small payments
Sending extremely small Bitcoin payments is impractical, because each transaction takes up space in the blockchain.  Currently, the reference implementation discourages nanopayments by charging [transaction fees][fees] for transactions smaller than 0.01 BTC and refusing to relay transactions of less than 5430 Satoshis ("dust") by default.

This protocol even lets users pay each other quantities less than 1 Satoshi.

This protocol is not to be confused with a [Bitcoin micropayments channel][micropayments], which allows two users to group many small transactions between themselves into a larger transaction.

### Rapid payments
An entity that sends rapid payments needs to have a lot of money in its account.  Otherwise, it must wait between payments so that the recipient of the payments can verify that a double-spend attack is not being committed.  Probabilistic nanopayments avoid this problem because they can pay the same value while sending fewer transactions to the blockchain.

Properties
----------
### Advantages
### Of this protocol
* Neither party needs to trust the other party
* Neither party can cheat the other party
* Can be used with any transport mechanism
* The smallest possible payment is infinitesimal
* Requires only two network round trips between payer and payee

### Limitations
#### Of this protocol
* The recipient must hold the private key for the account that's being paid to
* The payee must have a small amount of money to get paid
* The payee can be DDoS'ed unless he is able to filter out illegitimate payment requests
* Each payment requires two transactions (hence double the transaction fee)
* The rate at which the payee can be paid depends on how much money the payee has
* Payment requires two round trips between the payer and payee
* Only supports payments with probability *1/K*, where *K* is an integer

#### Of this implementation
* Stores the private key in a plaintext file
* Requires use of Bitcoin-Qt's RPC functionality
* Hardcoded to only send transactions for 0.01 BTC (smallest no-fee tx as of August 2013)
* Can only send or receive one transaction at a time
* Hardcoded to use testnet bitcoins
* Minimum payment is 5.92e-13 Satoshis

### Asymptotic Guarantees
For *N* vouchers, each for *x* BTC and being cashable with a probability *p,* the distribution of payments made follows a binomial distribution with parameters *N* and *p,* scaled by *x.*  The scaled distribution has mean *xNp* and variance *x*√(*Np*(1 - *p*)).

The Poisson approximation to the binomial distribution is appropriate when *p* is small and *N* is large. In this case the returns are approximated by a Poisson distribution with parameter *Np*, scaled by *x*.

The normal approximation of the binomial distribution is appropriate when *Np* >> 1.  In this case, the returns are approximated by normal distribution with mean *xNp* and standard deviation *x*√(*Np*).

The ratio of actual returns to expected returns is a distribution with mean 1 and standard deviation less than 1/√(*Np*).


Setup
-----
### Bitcoin-Qt setup
In order to use this library, you must install [Bitcoin-Qt][bitcoin-qt] and enable RPC.

Create or modify Bitcoin-Qt's [`bitcoin.conf`][bitcoin-conf] file to enable the RPC server.  Set `testnet` to `1` only if you're using the testnet.  Be aware that this lets any program that can read this password have access to your Bitcoin wallet.  **THIS IS A SECURITY RISK.**

    testnet=1

    rpcuser=admin
    rpcpassword=12345
    server=1


How to Use
----------
Alice can pay Bob as follows:

### Step 1
Bob requests a payment from Alice by calling the `requestVoucher` method.  He sends the result of this method (the "target") to Alice.

### Step 2
Alice creates a voucher based on the target by calling `createVoucher` and passing in the target.  She sends the voucher she just created to Bob.

### Step 3
Bob calls `cashVoucher` on the voucher he just received from Alice.  The result of this method tells him whether the payment was valid, and whether or not it was cashable.


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