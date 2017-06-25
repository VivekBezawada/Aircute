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
  res.json({"httpStatus":403,"data":null});
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
        req.session.error = 'Could not log user in. Please try again.';

         //inform user could not log them in
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

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});


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
		console.log("Connected...")    
	  }
	});
})

////////////////////////////////////////////
////////////// AUTHENTTICATION /////////////
////////////////////////////////////////////

// POST Request - Signup for the Client
app.post('/api/signUp', passport.authenticate('signupMediaOwner'), function(req,res){
	if(req.user) {
		res.json({"httpStatus":200,"data":req.user.username})
	} else {
		res.json({"httpStatus":501,"data":null})
	}
});



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



// GET Request - Login Media owner
app.get('/signinMediaOwner', function(req,res){
	res.render('signinMediaOwner', { layout:null, title: 'Signin as a Media Owner | Aircute'});
})
*/

//POST Request - Login Media Owner
app.post('/api/auth', passport.authenticate('signinMediaOwner'),function(req,res){
	if(req.user) {
		res.json({"httpStatus":200,"data":req.user});
	} else {
		res.json({"httpStatus":401,"data":null});	
	}
});


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
app.get('/api/auth/logout', function(req, res){
  var name = req.user.username;
  console.log("LOGGING OUT " + req.user.username)
  req.logout();
  req.session.notice = "You have successfully been logged out " + name + "!";
  res.json({"httpStatus":200, "data":null})
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

	db.collection('mediaOwners').find({userName:"startworld"}).toArray(function(err,results){

		res.json(results[0])
	})
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

/////////////////////////////////////////
////////////////  MEDIA  ////////////////
/////////////////////////////////////////


app.get('/api/media',ensureAuthenticated, function(req,res){
	db.collection('media').find({"createdBy":req.user.username}).toArray(function(err,results){
		if(err) {
			console.log(Err)
			res.json({"httpStatus":404, "data":null})
		}
		else if(results.length !=0) {
			res.json({"httpStatus":200, "data":results})
		}
		else {
			res.json({"httpStatus":404, "data":null})
		}
	})
})


app.get('/api/media/:handler',ensureAuthenticated, function(req,res){
	db.collection('media').find({$and: [{"createdBy":req.user.username},{"handler":req.params.handler}]}).toArray(function(err,results){
		if(err) {
			console.log(Err)
			res.json({"httpStatus":404, "data":null})
		}
		else if(results.length ==1) {
			res.json({"httpStatus":200, "data":results[0]})
		}
		else {
			res.json({"httpStatus":404, "data":null})
		}
	})
})

app.post('/api/media',ensureAuthenticated, function(req,res){
	var data = req.body
	data.handler = data.title.replace(/[^a-zA-Z0-9]/g, '-');
	data.createdBy = req.user.username;
	data.createdAt = new Date();

	db.collection('media').insert(data, function(err,resul){
		if(!err){
			res.json({"httpStatus":200,"data":data.handler})
		} else {
			res.json({"httpStatus":500,"data":data.handler})
		}
	})
})

app.put('/api/media/:handler', ensureAuthenticated, function(req,res){
	var data = req.body
	if(data.title) {
		req.body.handler = data.title.replace(/[^a-zA-Z0-9]/g, '-');
	}
	db.collection('media').update({$and : [{"handler":req.params.handler},{"createdBy":req.user.username}]},{$set:req.body}, function(err,results){
		if(!err && results.result.n ==1){
			res.json({"httpStatus":200,"data":req.body.handler || req.params.handler});
		} else if(results.result.n ==0){
			res.json({"httpStatus":404,"data":req.params.handler})
		} else {
			res.json({"httpStatus":500,"data":req.params.handler})
		}
		
	})
})

app.delete('/api/media/:handler',ensureAuthenticated, function(req,res){
	db.collection('media').remove({$and : [{"handler":req.params.handler},{"createdBy":req.user.username}]}, function(err,results){
		if(!err && results.result.n ==1){
			res.json({"httpStatus":200,"data":req.params.handler});
		} else if(results.result.n ==0){
			res.json({"httpStatus":404,"data":req.params.handler})
		} else {
			res.json({"httpStatus":500,"data":req.params.handler})
		}
	})
})

/////////////////////////////////////////
//////////////  SCHEDULES  //////////////
/////////////////////////////////////////


app.get('/api/schedule',ensureAuthenticated, function(req,res){
	var arr = []
	var sch = {}
	var count = 0;
	db.collection('schedules').find({"createdBy":req.user.username}).toArray(function(err,results){
		if(results == null) {
			res.json({"httpStatus":404, "data":null})
		} else if(err) {
			console.log(Err)
			res.json({"httpStatus":500, "data":null})
		} else {
			count = results.length
			for(var i=0;i<results.length;i++) {
				sch = results[i]
				db.collection('media').find({$and : [{"handler":results[i].mediaHandler},{"createdBy":req.user.username}]}).toArray(function(err,resul){
					if(!err){
						if(resul != undefined) {
							sch.media = resul[0]
						} else {
							sch.media = {}
						}
						arr.push(sch)
						count--;
						if(count==0) {
							res.json({"httpStatus":200,"data":arr});
						}
					}
				})
			}
		}
	})
})


app.get('/api/schedule/:handler',ensureAuthenticated, function(req,res){
	db.collection('schedules').find({$and: [{"createdBy":req.user.username},{"handler":req.params.handler}]}).toArray(function(err,results){
		if(err) {
			console.log(Err)
			res.json({"httpStatus":500, "data":null})
		}
		else if(results.length ==1) {
			sch = results[0]
			db.collection('media').find({$and : [{"handler":results[0].mediaHandler},{"createdBy":req.user.username}]}).toArray(function(err,resul){
				if(resul != undefined) {
					sch.media = resul[0]
				} else {
					sch.media = {}
				}
				res.json({"httpStatus":200, "data":sch})
			})
		}
		else {
			res.json({"httpStatus":404, "data":req.params.handler})
		}
	})
})

app.post('/api/schedule',ensureAuthenticated, function(req,res){
	var data = req.body
	data.handler = data.title.replace(/[^a-zA-Z0-9]/g, '-');
	data.createdBy = req.user.username;
	data.createdAt = new Date();
	db.collection('schedules').insert(data, function(err,resul){
		if(!err){
			res.json({"httpStatus":200,"data":data.handler})
		} else {
			res.json({"httpStatus":500,"data":data.handler})
		}
	})
})

app.put('/api/schedule/:handler', ensureAuthenticated, function(req,res){
	var data = req.body
	if(data.title) {
		req.body.handler = data.title.replace(/[^a-zA-Z0-9]/g, '-');
	}
	db.collection('schedules').update({$and : [{"handler":req.params.handler},{"createdBy":req.user.username}]},{$set:req.body}, function(err,results){
		if(!err && results.result.n ==1){
			res.json({"httpStatus":200,"data":req.body.handler || req.params.handler});
		} else if(results.result.n ==0){
			res.json({"httpStatus":404,"data":req.params.handler})
		} else {
			res.json({"httpStatus":500,"data":req.params.handler})
		}
		
	})
})

app.delete('/api/schedule/:handler',ensureAuthenticated, function(req,res){
	db.collection('schedule').remove({$and : [{"handler":req.params.handler},{"createdBy":req.user.username}]}, function(err,results){
		if(!err && results.result.n ==1){
			res.json({"httpStatus":200,"data":req.params.handler});
		} else if(results.result.n ==0){
			res.json({"httpStatus":404,"data":req.params.handler})
		} else {
			res.json({"httpStatus":500,"data":req.params.handler})
		}
	})
})