var qrCode = require('qr-image');
var crypto = require('crypto');
var NodeRSA = require('node-rsa');
var mongoose = require('mongoose');
var User = require('models/User');

var Schema = mongoose.Schema;
var messageSchema = new Schema({
	recipientId: String,
	messageBody: String
});
var Message = mongoose.model('Message', messageSchema);


// Helper: Get user by username;

var getUserIfExists = function(username) {
	User.find({"username": username}, function(err, user){
		if (err) {
			 res.status(500).send('Something broke!' + err);
		}
		return user[0];
	});
}

// Create - Creates a new message
// Image - Generate QR Code
// Show - Shows message

exports.configure = function (req, res) {
	// configure only runs when someone's logged in
	// get pin from post
	var pin = req.body.pin;
	user = getUserIfExists(req.body.username);

	hash = crypto.createHash('sha256');
	hash.update(pin + user.salt);
	user.passHypash = hash.digest('hex');

	if(user.save()){
		req.send('your pin is saved!');
	} else {
		 res.status(500).send('Something broke!' + err)
	}
}

exports.privkey = function (req, res){
	var username = res.locals.user.displayName;
	User.find({"username": username}, function(err, user){
		user = user[0];

		// GENERATE SALT + HASH OF PIN
		var salt = crypto.randomBytes(32).toString('hex');
		var pass = req.body.pass;


		// console.log(user);
		var privateKey = user.privateKey;
		// console.log(privateKey);
		var qr_privkey = qrCode.image(privateKey, { type: 'png' });
		res.set('Content-Type', 'image/png');
		qr_privkey.pipe(res);
	});
}

exports.create = function( req, res ) {
	// encryption module:
	var recipient = req.body.recipient;
	User.find({"username": recipient}, function(err, user){
		if (err) res.status(500).send('Something broke!' + err);
		user = user[0];

		// encrypt message and create

		var publicKey = new NodeRSA();
		publicKey.importKey(user.publicKey, 'pkcs8-public-pem');
		var encryptedMessage = publicKey.encrypt(req.body.message, "hex");
		Message.create({
			recipientId: req.body.recipient,
			messageBody: encryptedMessage
			// messageBody: req.body.message
		},
		function (err, message) {
		  if (err) res.status(500).send('Something broke!' + err);
		  res.send(message._id)
		})
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
	user = getUserIfExists(req.body.username);

	reqHash = crypto.createHash('sha256');
	reqHash.update(pin + user.salt);

	// check if hashes equal
	if(user.passHash == reqHash.digest('hex')){
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
