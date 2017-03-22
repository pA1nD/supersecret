var express = require('express');
var mongoose = require('mongoose');
var request = require("request");
var passport = require('passport');
var Auth0Strategy = require('passport-auth0');
var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn();
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var messages = require("controllers/messages");
var models = require("models");
var encryptHelp = require('helpers/encryptionHelper');

var User = models.User;

// settings
var port = process.env.PORT || 3000;
var db = process.env.MONGODB_URI
mongoose.connect(db);
callbackURL = process.env.AUTH0_CALLBACK_URL || 'http://localhost:3000/callback';

// Configure Passport to use Auth0
var strategy = new Auth0Strategy({
    domain:       process.env.AUTH0_DOMAIN,
    clientID:     process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    callbackURL:  callbackURL
  }, function(accessToken, refreshToken, extraParams, profile, done) {
    // accessToken is the token to call Auth0 API (not needed in the most cases)
    // extraParams.id_token has the JSON Web Token
    // profile has all the information from the user
    return done(null, profile);
  });


var auth0_access_token_timestamp = (Date.now() - (1000 * 60 * 60 * 2));
var auth0_access_token = ""

function refreshJWT(cb){
  var ONE_HOUR = 60 * 60 * 1000;

  if (((new Date) - auth0_access_token_timestamp) < ONE_HOUR){
    cb(auth0_access_token);
  }
  else {
    var options = {
      method: 'POST',
      url: process.env.AUTH0_API_URL,
      headers: { 'content-type': 'application/json' },
      body: `{"client_id":"${process.env.AUTH0_API_CLIENT}",
        "client_secret":"${process.env.AUTH0_API_SECRET}",
        "audience":"${process.env.AUTH0_API_AUDIENCE}",
        "grant_type":"client_credentials"}`
    };
    request(options, function (error, response, body) {
      if (error) throw new Error(error);

      auth0_access_token = JSON.parse(body).access_token;
      auth0_access_token_timestamp = Date.now();
      cb(auth0_access_token);
    });
  }
};


// express settings
var app = express();
app.set('view engine', 'pug')
app.use(express.static('public'));
//read post requests
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));
app.use(cookieParser());
app.use(session({
  secret: process.env.COOKIE_SECRET,
  resave: true,
  saveUninitialized: true
}));
passport.use(strategy);
app.use(passport.initialize());
app.use(passport.session());

// This can be used to keep a smaller payload
passport.serializeUser(function(user, done) {
  done(null, user);
});
passport.deserializeUser(function(user, done) {
  done(null, user);
});

 // Local helpers
app.use( (req, res, done) => {
  res.locals.env = process.env
  res.locals.callbackURL = callbackURL

  if (req.isAuthenticated()) {
    res.locals.isAuthenticated = true
    encryptHelp.createUserAcct(req.user.displayName);
    res.locals.user = req.user
  }
  else {
    res.locals.isAuthenticated = false
    res.locals.user = {}
  }

  done()
})

// routes
// home
app.get('/', function(req, res) {

  refreshJWT( jwt => {

    var options = { method: 'GET',
      url: process.env.AUTH0_API_AUDIENCE + "users",
      headers: { authorization: "Bearer " + jwt } };
    request(options, function (error, response, users) {

      if (error) throw new Error(error);
      // name, email, picture
      res.render("index", {users: JSON.parse(users)});

    });
  })
});

// messages
app.post('/messages/create', messages.create);
app.post('/messages/show/:id', messages.show);
app.get('/messages/image/:id', messages.image);
app.get('/messages/stone/:id', messages.stone);

// Render the login template
app.get('/login',
  function(req, res){
    res.redirect("/?login=true")
  });

// Perform the final stage of authentication and redirect to '/user'
app.get('/callback',
  passport.authenticate('auth0', { failureRedirect: '/?login=true' }),
  function(req, res) {

    res.redirect(req.session.returnTo || '/');
  });

// Perform session logout and redirect to homepage
app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

//to: refactor (?)
app.get('/user/privkey', ensureLoggedIn, messages.configure);


// start server
app.listen(port, function () {
  console.log('Listening on port 3000!');
});
