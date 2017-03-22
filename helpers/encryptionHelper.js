var NodeRSA = require('node-rsa');
var mongoose = require('mongoose');
var crypto = require('crypto');
// Helper: Get user by username;

function getUserIfExists(username) {
	User.find({"username": username}, function(err, user){
		if (err) {
			 res.status(500).send('Something broke!' + err);
		}
		return user[0];
	});
}


// creates a user account on user signup
// called by authentication function in server.js
function createUserAcct (username){
	// query if user exists:
  User.count({"username": username}, function(err, count){
    if(count == 0) { // no user, go generate a key pair

      var key = new NodeRSA();
      key.generateKeyPair();
      var publicPem = key.exportKey('pkcs8-public-pem');
      var privatePem = key.exportKey('pkcs8-private-pem');

      // GENERATE SALT
      var userSalt = crypto.randomBytes(32).toString('hex');

      User.create({
        username: username,
        publicKey: publicPem,
        privateKey: privatePem,
        salt: userSalt,
      });

    }

  });
}

function createEncryptedMessage(recipientName, message){
	recipient = getUserIfExists(recipientName);

	var publicKey = new NodeRSA();
	publicKey.importKey(recipient.publicKey, 'pkcs8-public-pem');
	var encryptedMessage = publicKey.encrypt(req.body.message, "hex");
	Message.create({
		recipientId: recipientName,
		messageBody: encryptedMessage
	},
	function (err, message) {
	  if (err) return false;
	  return message._id;
	})
}

function hashPin(salt, pin) {
	hash = crypto.createHash('sha256');
	hash.update(pin + salt);
	return hash.digest('hex');
}

function storeUserPin(username, pin) {
	user = getUserIfExists(username);
	user.passHash = hashPin(pin, user.salt);

	if(user.save()){
		return true;
	} else {
		 return false;
	}
}

function authenticatePin(username, pin) {
	user = getUserIfExists(username);
	reqHash = hashPin(pin, user.salt);

	//check if hashes equal
	if(user.passHash == reqHash) {
		return true;
	} else {
		return false;
	}

}