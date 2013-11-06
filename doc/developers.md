For Developers
==============
This document is for developers interested in improving or porting this library.

Protocol
--------
This is a protocol for sending a fair probabilistic payment from one party to another.  Note that this protocol does not specify a transport for the data; the application is responsible for sending and receiving information between the two parties.

Alice pays Bob as follows:

### Step 1
Bob creates a transaction to Alice, for the amount of money that she will pay him.  He stores it locally, but does not send it out to the network.  He randomly chooses a range of consecutive numbers that includes the transaction ID.  Note that the size of the range is equal to the inverse of the probability that the voucher will be cashable.  Bob sends a serialized specification of the range (the "target") to Alice.

#### Serialized target
Everything's just ASCII-encoded, separated by dashes.  The individual data items are.

* amount to send, in Satoshis - integer
* inverse probability of success - integer
* previous vout - integer
* txid range start - hex-encoded integer, padding with zeros optional

    100000-100-0-4b22a85743cb108367132d566b0525f7ea08215497b61ab079c95f0b846fc103

This serialized target represents a payment for 0.01 BTC (100000 Satoshis) that has a 1 in 100 chance of being cashable.

### Step 2
Alice creates a transaction from herself to Bob, using a random number in the range as the previous transaction ID for one of the vins.  The other vin is from herself.  The vout to Bob will be 2x the amount of the transaction (minus fees), because it also pays Bob's vin back to him.  Alice signs the transaction and sends it to Bob.

### Step 3
Bob checks whether Alice's transaction was valid.  If Alice's guess matches Bob's transaction ID, Bob can cash the transaction in by broadcasting it to the network.  Otherwise, the transaction is worthless and Bob throws it away.

Potential Attacks
-----------------
### DDOS'ing a payee
Since the payee can only receive a limited number of payments at a time, a network of payers could ask the payee to generate targets, but then never actually use the targets.

### Double-spending
This system is no more or less resistant to double-spending than ordinary Bitcoin payments of the same frequency.

### Generating transaction ID's
If the payee can generate many transaction ID's that are near to each other, he can create payments that are likely to be valid.  TODO: quantify the cost/benefit of doing this.


Tests
-----
To run the tests, you'll need to create the file `config/rpc.json` like the following:

    {
      "host": "localhost",
      "port": 18332,
      "user": "admin",
      "pass": "12345"
    }

You must also create `config/test-accounts.json` like the following:

    {
      "sourceAddress": "n4azoZaLB2GA3h4di2ZszYXo5EH4oXAYbQ",
      "sourcePrivateKey": "cSxQsUNZLcHyiqP4h39hxGJYwhhgHJZD4N5wczxm6nTwWQmkQJWe",
      "destinationAddress": "mj5ZqP371yeRxZkdvz4fNQK7k5QrXMsQXD",
      "destinationPrivateKey": "cQ6eSLaL3YPoDbDzCHFsrH34DFweaqtG9ZnLh6vd7rz9yprMHx5G"
    }

These files are not added to git, to avoid accidental sharing.

The source and destination addresses must each have at least 0.01 BTC for the test to run.

[mean-minimum-distance][http://mathoverflow.net/questions/1294/mean-minimum-distance-for-n-random-points-on-a-one-dimensional-line]