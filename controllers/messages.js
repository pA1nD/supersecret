var qrCode = require('qr-image');
var crypto = require('crypto');
var mongoose = require('mongoose');
var models = require('../models');
var encryptHelp = require('../helpers/encryptionHelper');


var User = models.User;
var Message = models.Message;
// Create - Creates a new message
// Image - Generate QR Code
// Show - Shows message

exports.configure = function (req, res) {
	// configure only runs when someone's logged in
	// get pin from post
	var username = res.locals.user.displayName;
	var pin = req.body.pin;
	
	if(storeUserPin(username, pin)){
		req.send('your pin is saved!');
	} else {
		 res.status(500).send('Something broke!' + err)
	}
}

exports.displayPrivkeyQR = function (req, res){
	var username = res.locals.user.displayName;
	user = getUserIfExists(username);

	var qr_privkey = qrCode.image(user.privateKey, { type: 'png' });
	res.set('Content-Type', 'image/png');
	qr_privkey.pipe(res);
}

exports.create = function( req, res ) {
	// encryption module:
	var recipientName = req.body.recipient;
	var message = req.body.message;
	
	encryptHelp.createEncryptedMessage(recipientName, message, function(messageId){
		if(messageId != false) {
			res.send(messageId);
		} else {
			res.status(500).send('Something broke!');
		}
	});
}

exports.stone  = function( req, res ) {
	message = req.param('id');
	res.render("stone", {message: message});
};

exports.image = function(req, res) {
	messageId = req.param('id');
	var baseurl = (process.env.NODE_ENV == 'production' ? 'https://supersecretserver.herokuapp.com':'localhost:3000');
	var wholeUrl = baseurl + '/messages/show/'+ messageId;

	var qr_png = qrCode.image(wholeUrl, { type: 'png' });
	res.set('Content-Type', 'image/png');
	qr_png.pipe(res);
}

exports.show = function(req, res) {
	// authenticate pin
	var pin = req.body.pin; // remind alex to chainge request to pin instead of password
	var user = res.body.locals.displayName;
	var messageId = req.param('id'); 

	if(authenticatePin(username, pin)){
		//user is authenticated
		Message.findById(messageId, function(err, message) {
			if (err) res.status(500).send('Something broke!' + err);
			res.json({'message': message.messageBody});
		});
	} else {
		res.json({'message': 'Wrong Password, Try Again'});
	}

	// Authenticate user -hardcoded version
	// if(req.body.password == '1111'){
	// 	messageId = req.param('id');
	// 	Message.findById(messageId, function(err, message) {
	// 		if (err) res.status(500).send('Something broke!' + err);
	// 		res.json({'message': message.messageBody});
	// 	});
	// } else {
	// 	res.json({'message': 'Wrong Password, Try Again'});

	// }
}
