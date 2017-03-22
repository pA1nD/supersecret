var mongoose = require('mongoose');


var Schema = mongoose.Schema;
var userSchema = new Schema({
 username: String,
 publicKey: String,
 privateKey: String,
 salt: String,
 passHash: String
});

exports.User = mongoose.model("User", userSchema)

// ********************

var Schema = mongoose.Schema;
var messageSchema = new Schema({
	recipientId: String,
	messageBody: String
});
exports.Message = mongoose.model('Message', messageSchema);

