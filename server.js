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
	if(req.isAuthenticated()) {
		if (req.user.role =='admin') {
			return next(); 
		}
	}
    req.session.error = 'Please sign in!';
  	res.status(403).send("Forbidden");
}

function userLogin(req,res,next){
	if(req.isAuthenticated()) {
		if (req.user.role == 'user') {
	  		return next();
		}
	}
	req.session.error = 'Please sign in!';
	res.status(403).send("Forbidden");
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
// Admin SignUp POST
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


// User SignUp POST
passport.use('signupUser', new LocalStrategy(
  {passReqToCallback : true}, //allows us to pass back the request to the callback
  function(req, username, password, done) {
    funct.signupUser(username, password, req.body.email,req.body.name,req.body.mobileNumber,req.body.imageUrl,req.body.city,req.body.country,req.body.pinCode)
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
app.use(session({secret: 'aircutesecretcode', saveUninitialized: true, resave: true,httpOnly:false}));
app.use(passport.initialize());
app.use(passport.session());

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.engine('html', require('hbs').__express);

app.use(function(req, res, next) {

  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
  res.header("Access-Control-Allow-Origin", "http://localhost:27690");
  res.header("Access-Control-Allow-Credentials", true);
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

// POST Request - Signup ADMIN
app.post('/api/signUp', passport.authenticate('signupMediaOwner'), function(req,res){
	if(req.user) {
		res.status(200).send({"data":req.user.username});
	} else {
		res.status(500).send("Try Again");
	}
});

// POST Request - Signup USER
app.post('/api/usr/signUp', passport.authenticate('signupUser'), function(req,res){
	if(req.user) {
		res.status(200).send({"data":req.user.username});
	} else {
		res.status(500).send("Try Again");
	}
});

//POST Request - Login Media Owner or User
app.post('/api/auth', passport.authenticate('signinMediaOwner'),function(req,res){
	if(req.user) {
		res.status(200).send({"data":req.user});
	} else {
		res.status(401).send();
	}
});



app.get('/api/auth/logout', function(req, res){
	if(req.user) {
		var name = req.user.username;
		console.log("LOGGING OUT " + req.user.username)
		req.logout();
		req.session.notice = "You have successfully been logged out " + name + "!";
		res.status(200).send("logged out");
	}
});

///////////////////////////////////////
//////// END OF AUTHENTICATION ////////
///////////////////////////////////////



///////////////////////////////////////
/////////////  LISTINGS  //////////////
///////////////////////////////////////

app.get('/api/listing', function(req,res){
	var arr = []
	var sch = {}
	var count = 0;
	db.collection('schedules').find({}).toArray(function(err,results){
		if(results == null) {
			res.status(404).send("No data found");
		} else if(err) {
			console.log(Err)
			res.status(404).send("Please try again");
		} else {
			count = results.length
			for(var i=0;i<results.length;i++) {
				sch = results[i]
				db.collection('media').find({"handler":results[i].mediaHandler}).toArray(function(err,resul){
					if(!err){
						if(resul != undefined) {
							sch.media = resul[0]
						} else {
							sch.media = {}
						}
						arr.push(sch)
						count--;
						if(count==0) {
							res.status(200).send({"data":arr});
						}
					}
				})
			}
		}
	})
})


app.get('/api/listing/:handler', function(req,res){
	db.collection('schedules').find({"handler":req.params.handler}).toArray(function(err,results){
		if(err) {
			console.log(err)
			res.status(500).send("Try Again");
		}
		else if(results.length ==1) {
			sch = results[0]
			db.collection('media').find({"handler":results[0].mediaHandler}).toArray(function(err,resul){
				if(resul != undefined) {
					sch.media = resul[0]
				} else {
					sch.media = {}
				}

				res.status(200).send({"data":sch});
			})
		}
		else {
			res.status(404).send({"data":req.params.handler});
		}
	})
})

/////////////////////////////////////////
////////////////  USERS  ////////////////
/////////////////////////////////////////

app.get('/api/loggedUser', ensureAuthenticated, function(req,res){
	db.collection('mediaOwners').find({"username":req.user.username}).toArray(function(err,results){
		if(err) {
			console.log(Err)
			res.status(500).send("Try Again");
		} else {
			res.status(200).send({data:results[0]});
		}
	})
})

app.get('/api/usr/loggedUser', userLogin, function(req,res){
	db.collection('mediaOwners').find({"username":req.user.username}).toArray(function(err,results){
		if(err) {
			console.log(Err)
			res.status(500).send("Try Again");
		} else {
			res.status(200).send({data:results[0]});
		}
	})
})


/////////////////////////////////////////
////////////////  MEDIA  ////////////////
/////////////////////////////////////////


app.get('/api/media',ensureAuthenticated, function(req,res){
	db.collection('media').find({"createdBy":req.user.username}).toArray(function(err,results){
		if(err) {
			console.log(Err)
			res.status(500).send("Try Again");
		}
		else if(results.length !=0) {
			res.status(200).send({"data":results});
		}
		else {
			res.status(404).send("No data found");
		}
	})
})


app.get('/api/media/:handler',ensureAuthenticated, function(req,res){
	db.collection('media').find({$and: [{"createdBy":req.user.username},{"handler":req.params.handler}]}).toArray(function(err,results){
		if(err) {
			console.log(Err)
			res.status(500).send("Try Again");
		}
		else if(results.length ==1) {
			res.status(200).send({"data":results[0]});
		}
		else {
			res.status(404).send("No data found");
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
			res.status(200).send({"data":data.handler});
		} else {
			res.status(500).send("Try Again");
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
			res.status(200).send({"data":req.body.handler || req.params.handler});
		} else if(err){
			console.log(err)
			res.status(500).send("Try Again");
		} else{
			res.status(404).send("No data found");
		}
		
	})
})

app.delete('/api/media/:handler',ensureAuthenticated, function(req,res){
	db.collection('media').remove({$and : [{"handler":req.params.handler},{"createdBy":req.user.username}]}, function(err,results){
		if(!err && results.result.n ==1){
			res.status(200).send({"data":req.params.handler});
		} else if(err){console.log(err)
			res.status(500).send("Try Again");
		} else{
			res.status(404).send("No data found");
		}
	})
})

/////////////////////////////////////////
//////////////  SCHEDULES  //////////////
/////////////////////////////////////////


app.get('/api/schedule',ensureAuthenticated, function(req,res){
	var query = '{"createdBy":' +req.user.username +',';
	if(req.query.startDate != null) {
		query += '"programSchedule.startDate":{$gte:' + parseInt(req.query.startDate);
	}
	if(req.query.endDate != null) {
		query += ',"programSchedule.endDate":{$gte:' + parseInt(req.query.endDate);
	}
	query +='}';
	//console.log(query);
	//console.log(req.query);
	var arr = []
	var sch = {}
	var count = 0;
	db.collection('schedules').find({"createdBy": req.user.username}).toArray(function(err,results){
		if(results.length == 0) {
			res.status(404).send("No data found");
		} else if(err) {
			console.log(Err)
			res.status(500).send("Try Again");
		} else {
			count = results.length
			for(var i=0;i<results.length;i++) {

				getSchedules(req,results[i],res);
				function getSchedules(req,obj,res) {
					db.collection('media').find({$and : [{"handler":obj.mediaHandler},{"createdBy":req.user.username}]}).toArray(function(err,resul){
						if(!err){
							sch = obj;
							if(resul[0] != undefined) {
								sch['media'] = resul[0]
							} else {
								sch['media'] = {}
							}
							arr.push(sch)
							sch = {}
							count--;
							if(count==0) {
								res.status(200).send({"data":arr});
							}
						}
					})
				}
			}
		}
	})
})

	/*
				sch.programSchedule.startDate = sch.programSchedule.startDate - new Date().getTimezoneOffset()*60*1000
			sch.programSchedule.endDate = sch.programSchedule.endDate - new Date().getTimezoneOffset()*60*1000
			sch.programSchedule.startTime = sch.programSchedule.startTime - new Date().getTimezoneOffset()*60*1000
			sch.programSchedule.endTime = sch.programSchedule.endTime - new Date().getTimezoneOffset()*60*1000
			*/


app.get('/api/schedule/:handler',ensureAuthenticated, function(req,res){
	db.collection('schedules').find({$and: [{"createdBy":req.user.username},{"handler":req.params.handler}]}).toArray(function(err,results){
		if(err) {
			console.log(Err)
			res.status(500).send("Try Again");
		}
		else if(results.length ==1) {
			sch = results[0]
			/*
			sch.programSchedule.startDate = sch.programSchedule.startDate + new Date().getTimezoneOffset()*60*1000
			sch.programSchedule.endDate = sch.programSchedule.endDate + new Date().getTimezoneOffset()*60*1000
			sch.programSchedule.startTime = sch.programSchedule.startTime + new Date().getTimezoneOffset()*60*1000
			sch.programSchedule.endTime = sch.programSchedule.endTime + new Date().getTimezoneOffset()*60*1000
			*/
			db.collection('media').find({$and : [{"handler":results[0].mediaHandler},{"createdBy":req.user.username}]}).toArray(function(err,resul){
				if(resul != undefined) {
					sch.media = resul[0]
				} else {
					sch.media = {}
				}
				res.status(200).send({"data":sch});
			})
		}
		else {
				res.status(404).send("No data found");
		}
	})
})

app.post('/api/schedule',ensureAuthenticated, function(req,res){
	var data = req.body
	data.handler = data.title.replace(/[^a-zA-Z0-9]/g, '-');
	data.createdBy = req.user.username;
	data.createdAt = new Date();
	db.collection('schedules').find({"handler":data.handler}).toArray(function(err,results){
		console.log(results);
		if(results[0] == null) {
			db.collection('schedules').insert(data, function(err,resul){
				if(!err){
					res.status(200).send({"data":data.handler});
				} else {
					res.status(500).send("Try Again");
				}
			})
		} else {
			res.status(200).send({"data":null,"status":"Schedule handler already exists"});
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
			res.status(200).send({"data":req.body.handler || req.params.handler});
		} else if(err){
			console.log(err)
			res.status(500).send("Try Again");
		} else{
			res.status(404).send("No data found");
		}
		
	})
})

app.delete('/api/schedule/:handler',ensureAuthenticated, function(req,res){
	db.collection('schedules').remove({$and : [{"handler":req.params.handler},{"createdBy":req.user.username}]}, function(err,results){
		//console.log(results);
		if(!err && results.result.n ==1){
			res.status(200).send({"data":req.params.handler});
		} else if(err){
			console.log(err)
			res.status(500).send("Try Again");
		} else{
			res.status(404).send("No data found");
		}
	})
})




/////////////////////////////////////////
/////////////  USER RELATED  ////////////
/////////////////////////////////////////


app.get('/api/usr/allDetails', userLogin, function(req,res){
	db.collection('mediaOwners').find({"username":req.user.username}).toArray(function(err,results){
		if(!err) {
			if(results[0] != null) {
				res.status(200).send({"data":results[0]});	
			}else {
				res.status(404).send("No data found");
			}
		} else {
			console.log(err)
			res.status(500).send("Try Again");
		}
	})
})

app.post('/api/usr/purchase',userLogin, function(req,res){
	db.collection('mediaOwners').update({"username":req.user.username},{$push :{purchases : {"title":req.body.title}}}, function(err,results){
		if(err) {
			res.status(500).send("Try Again");
		} else {
			res.status(200).send({"data":req.body.title});
		}
	})
})

app.post('/api/usr/wishlist',userLogin, function(req,res){
	db.collection('mediaOwners').update({"username":req.user.username},{$push :{wishlist : {"title":req.body.title}}}, function(err,results){
		if(err) {
			res.status(500).send("Try Again");
		} else {
			res.status(200).send({"data":req.body.title});
		}
	})
})

app.post('/api/usr/complaint',userLogin, function(req,res){
	db.collection('mediaOwners').update({"username":req.user.username},{$push :{complaint : {"id":req.body.id}}}, function(err,results){
		if(err) {
			res.status(500).send("Try Again");
		} else {
			res.status(200).send({"data":req.body.id});
		}
	})
})

app.post('/api/usr/cart',userLogin, function(req,res){
	db.collection('mediaOwners').update({"username":req.user.username},{$push :{cart : {"title":req.body.title}}}, function(err,results){
		if(err) {
			res.status(500).send("Try Again");
		} else {
			res.status(200).send({"data":req.body.title});
		}
	})
})

app.delete('/api/usr/wishlist/:title',userLogin, function(req,res){
	db.collection('mediaOwners').update({"username":req.user.username},{$pull: {wishlist : {"title":req.params.title}}}, function(err,results){
		if(err) {
			res.status(500).send("Try Again");
		} else {
			res.status(200).send({"data":req.params.title});
		}
	})
})

app.delete('/api/usr/cart/:title',userLogin, function(req,res){
	db.collection('mediaOwners').update({"username":req.user.username},{$pull: {cart : {"title":req.params.title}}}, function(err,results){
		if(err) {
			res.status(500).send("Try Again");
		} else {
			res.status(200).send({"data":req.params.title});
		}
	})
})
