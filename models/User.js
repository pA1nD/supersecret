var mongoose = require('mongoose');


var Schema = mongoose.Schema;
var userSchema = new Schema({
 username: String,
 publicKey: String,
 privateKey: String,
 salt: String,
 passHash: String
});
var User = mongoose.model("User", userSchema)
module.exports = User;
