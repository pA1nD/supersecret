var NodeRSA = require('node-rsa');
var mongoose = require('mongoose');
var crypto = require('crypto');
var models = require("../models");

var User = models.User;
var Message = models.Message;


// Helper: Get user by username;

// ctx is an object of whatever other stuff you wanna pass into the cb
function getUserIfExists(ctx, cb) {
	username = ctx.username;
	console.log(username);
	User.find({"username": username}, function(err, user){
		// console.log(user);
		if (err) {
			 res.status(500).send('Something broke!' + err);
		}
		cb(user[0]);
	});
}


// creates a user account on user signup
// called by authentication function in server.js
exports.createUserAcct = function (username){
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

exports.createEncryptedMessage = function (recipientName, message, cb){
	ctx = {
		'username': recipientName,
		'message': message
	};
	getUserIfExists(ctx, function(recipient){
		message = ctx.message;

		// console.log(recipient);
		var publicKey = new NodeRSA();
		publicKey.importKey(recipient.publicKey, 'pkcs8-public-pem');
		console.log(message);
		console.log(recipientName);
		var encryptedMessage = publicKey.encrypt(message, "hex");
		
		Message.create({
			recipientId: recipientName,
			messageBody: encryptedMessage
		}, function(err, message){
			if (err) cb(false);
			cb(message._id.toString())
		});
		// var message = new Message({
		// 	recipientId: recipientName,
		// 	messageBody: encryptedMessage
		// });
		// message.save(function(err){

		// });
	});
	
}

function HashPin(salt, pin) {
	hash = crypto.createHash('sha256');
	hash.update(pin + salt);
	return hash.digest('hex');
}

exports.storeUserPin = function (username, pin) {
	user = getUserIfExists(username, function(user){
	user.passHash = hashPin(pin, user.salt);
		if(user.save()){
			return true;
		} else {
			 return false;
		}	
	});
}

exports.authenticatePin = function (username, pin) {
	ctx = {
		'username':username
	};
	
	user = getUserIfExists(ctx, function(user){
		reqHash = hashPin(pin, user.salt);

		//check if hashes equal
		if(user.passHash == reqHash) {
			return true;
		} else {
			return false;
		}
	});
}