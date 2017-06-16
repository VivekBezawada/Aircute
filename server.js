var express = require('express'),
	logger = require('morgan'),
	bodyParser = require('body-parser'),
	cookieParser = require('cookie-parser'),
	methodOverride = require('method-override'),
    session = require('express-session'),
    passport = require('passport'),
    LocalStrategy = require('passport-local'),
	MongoClient = require('mongodb').MongoClient,
	path = require('path');


var config = require('./config.js'), 
    funct = require('./functions/authentication.js');

var dbConnection =config.mongodbUrl;

var app = express();

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  req.session.error = 'Please sign in!';
  res.redirect('/signinMediaOwner');
}

//===============PASSPORT===============
// Passport session setup.
passport.serializeUser(function(user, done) {
  console.log("serializing " + user.username);
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  console.log("deserializing " + obj);
  done(null, obj);
});


// Use the LocalStrategy within Passport to login/"signin" users.
passport.use('signinMediaOwner', new LocalStrategy(
  {passReqToCallback : true}, //allows us to pass back the request to the callback
  function(req, username, password, done) {
    funct.localAuth(username, password)
    .then(function (user) {
      if (user) {
        console.log("LOGGED IN AS: " + user.username);
        req.session.success = 'You are successfully logged in ' + user.username + '!';
        done(null, user);
      }
      if (!user) {
        console.log("COULD NOT LOG IN");
        req.session.error = 'Could not log user in. Please try again.'; //inform user could not log them in
        done(null, user);
      }
    })
    .fail(function (err){
      console.log(err.body);
    });
  }
));
// Use the LocalStrategy within Passport to register/"signup" users.
passport.use('signupMediaOwner', new LocalStrategy(
  {passReqToCallback : true}, //allows us to pass back the request to the callback
  function(req, username, password, done) {
    funct.signupMediaOwner(username, password, req.body.emailAddress,req.body.mediaName,req.body.phoneNumber,req.body.address,req.body.mediaLogo)
    .then(function (user) {
      if (user) {
        console.log("REGISTERED: " + user.username);
        req.session.success = 'You are successfully registered and logged in ' + user.username + '!';
        done(null, user);
      }
      if (!user) {
        console.log("COULD NOT REGISTER");
        req.session.error = 'That username is already in use, please try a different one.'; //inform user could not log them in
        done(null, user);
      }
    })
    .fail(function (err){
      console.log(err.body);
    });
  }
));


// view engine setup
//app.use(logger('combined'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(methodOverride('X-HTTP-Method-Override'));
app.use(session({secret: 'aircutesecretcode', saveUninitialized: true, resave: true}));
app.use(passport.initialize());
app.use(passport.session());

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.engine('html', require('hbs').__express);

// Session-persisted message middleware
app.use(function(req, res, next){
  var err = req.session.error,
      msg = req.session.notice,
      success = req.session.success;

  delete req.session.error;
  delete req.session.success;
  delete req.session.notice;

  if (err) res.locals.error = err;
  if (msg) res.locals.notice = msg;
  if (success) res.locals.success = success;

  next();
});


app.use(express.static(path.join(__dirname, 'public')));


// Listener and Database Connection
app.listen(80,function(){
	MongoClient.connect(dbConnection, function(err, database) {
		db = database
	  if(!err) {
			console.log("Database is COnnected and Application is running...")    
	  }
	});
})

//0. HomePage

app.get('/', function(req,res){
	res.json({"status":"success","load Page": "Home Page"})
	//res.render('homepage', { layout:'layouts/admin', title: 'Home Page | Aircute'});
})

////////////////////////////////////////////
////////////// AUTHENTTICATION /////////////
////////////////////////////////////////////

app.get('/signup', function(req,res){
	res.render('signup', { layout:null, title: 'Signup | Aircute'});
})

//GET Request - Signup for the Client
app.get('/signUpMediaOwner', function(req,res){
	res.render('signupMedia', { layout:null, title: 'Signup Media Owners | Aircute'});
})

// POST Request - Signup for the Client
app.post('/signUpMediaOwner', passport.authenticate('signupMediaOwner', {
  successRedirect: '/',
  failureRedirect: '/signUpMediaOwner'
  })
);



/*
	, function(req,res){
	var mediaLogo = '/logo/'
	var register = {"TimeStamp": new Date(),"mediaName":req.body.mediaName, "phoneNumber":req.body.phoneNumber, "emailAddress":req.body.emailAddress, "address":req.body.address, "username":req.body.username, "password":req.body.password, "mediaLogo":req.body.mediaLogo}
	db.collection('mediaOwners').insert(register, {w:1}, function(err,result){
		res.redirect('/')
	})
})
*/

/* USER MODE OFF
app.get('/signUpUser', function(req,res){
	res.render('signupUser', { layout:null, title: 'Signup | Aircute'});
})

app.post('/signUpUser', function(req,res){
	var register = {"TimeStamp": new Date(),"username":req.body.username, "password":req.body.password, "emailAddress":req.body.emailAddress}
	db.collection('users').insert(register, {w:1}, function(err,result){
		res.redirect('/')
	})
})
*/


// GET Request - Login Media owner
app.get('/signinMediaOwner', function(req,res){
	res.render('signinMediaOwner', { layout:null, title: 'Signin as a Media Owner | Aircute'});
})

//POST Request - Login Media Owner
app.post('/signinMediaOwner', passport.authenticate('signinMediaOwner', {
  successRedirect: '/admin',
  failureRedirect: '/signinMediaOwner'
  })
);


/* function(req,res){
	console.log(req.body.username)
	console.log(req.body.password)
	db.collection('mediaOwners').find({$and: [{"username":req.body.username}, {"password":req.body.password}]}).count(function(err, count){
		if(count == 1) {
				res.send("YOU ARE NOW LOGGED IN AS " + req.body.username + ". Please come back later for the admin panel")
			}
	})
})
*/

/* USER MODE OFF 
app.get('/signinUser', function(req,res){
	res.render('signinUser', { layout:null, title: 'Signin as a User | Aircute'});
})

POST Request - Login Media Owner
app.post('/signinUser', function(req,res){
	db.collection('users').find({$and: [{"userName":userName}, {"password":password}]}).count(function(err, count){
		if(count == 1) {
				res.send("YOU ARE NOW LOGGED IN AS A USER")
			}
	})
})
*/
app.get('/logout', function(req, res){
  var name = req.user.username;
  console.log("LOGGING OUT " + req.user.username)
  req.logout();
  res.redirect('/');
  req.session.notice = "You have successfully been logged out " + name + "!";
});

///////////////////////////////////////
//////// END OF AUTHENTICATION ////////
///////////////////////////////////////



///////////////////////////////////////
//////////// LISTINGS PAGE ////////////
///////////////////////////////////////

app.get('/listing', function(req,res){
	var passData = {}
	passData.layout = 'layouts/admin'
	passData.title =  'Listing | Aircute'
	
	db.collection('listings').find().toArray(function(err, result){

	})

	res.render('listings', passData)
	// some db operation to get the results
})

app.get('/listing/:id', function(req,res){
	// id is a title
	res.send("DETAILS PAGE")
})

///////////////////////////////////////
////////// END LISTINGS PAGE //////////
///////////////////////////////////////




/////////////////////////////////////////
//////////////ADMIN PANEL////////////////
/////////////////////////////////////////

app.get('/admin',ensureAuthenticated, function(req,res){

	res.json({"status":"logged in", 'page':"admin UI will come"});
	/*
	var passData = {title:"Admin Panel | Aircute", "layout":"layouts/admin", "user":req.user.mediaName};
	var listings = []

	db.collection('listings').find({"mediaOwnerUserName":req.user.username}).toArray(function(err,result){
		if(result.length == undefined || result.length == 0) {
			res.render('admin', passData);
		}
		else {
			for(var i=0;i<result.length;i++) {
				if(result[i].saleHistory.length != 0) {
					passData.programs = true;
					for(var j=0;j<result[i].saleHistory.length;j++) {
						//
						result[i].soldTo = "vivek";
						//
						listings.push(result[i])
						//console.log(result[i].saleHistory[j])
					}
				}
				else {
					passData.programs = false;
					res.render('admin', passData)
				}
			}
			passData.listings = listings;
			console.log(passData);
			res.render('admin', passData);
		}

		
	})
	*/
})

app.get('/adminAjax',ensureAuthenticated,function(req,res){

})