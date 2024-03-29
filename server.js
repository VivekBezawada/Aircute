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
  res.header("Access-Control-Allow-Origin", "http://skyslit-demo.000webhostapp.com");
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

	var query={};
	var demographic = {}
	if(req.query.type) {
		query.type = req.query.type;
	}
	if(req.query.liveCamera) {
		query.liveCamera = (req.query.liveCamera == 'true');
	}
	if(req.query.genre) {
		query.genre = req.query.genre;
	}
	if(req.query.accolades) {
		query.accolades = req.query.accolades;
	}
	if(req.query.cast) {
		query.cast = req.query.cast;
	}

	if(req.query.budgetMin && req.query.budgetMax) {
		var estReach = '{ "$gte": '+ req.query.budgetMin+', "$lte": ' + req.query.budgetMax + '}';
		query.estimateReach = JSON.parse(estReach);
	}
	if(req.query.priceMin && req.query.priceMax) {
		var price = '{ "$gte": '+ req.query.priceMin+', "$lte": ' + req.query.priceMax + '}';
		query.price = JSON.parse(price);
	}
	if(req.query.ageMin && req.query.ageMax) {
		query["demographic.minAge"] = JSON.parse('{ "$gte":'+ req.query.ageMin +'}');
		query["demographic.maxAge"] = JSON.parse('{ "$lte":'+ req.query.ageMax +'}');
	}
	if(req.query.incomeMin && req.query.incomeMax) {
		query["demographic.minIncomePerAnnum"] = JSON.parse('{ "$gte":'+ req.query.incomeMin +'}');
		query["demographic.maxIncomePerAnnum"] = JSON.parse('{ "$lte":'+ req.query.incomeMax +'}');
	}
	
	var arr = []
	var sch = {}
	var count = 0;
	var size = 10;
	var skip = 0;
	if(req.query.size) {
		var size = req.query.length
	}
	if(req.query.skip) {
		var skip = (req.query.page -1)*size
	}
	console.log(query)
	db.collection('schedules').find(query,{"limit":size,"skip":skip}).toArray(function(err,results){
		
	console.log(results.length);

		if(results.length == 0) {
			res.status(404).send("No data found");
		} else if(err) {
			console.log(err)
			res.status(500).send("Try Again");
		} else {
			count = results.length
			for(var i=0;i<results.length;i++) {

				getSchedules(req,results[i],res);
				function getSchedules(req,obj,res) {
					db.collection('media').find({"handler":obj.mediaHandler}).toArray(function(err,resul){
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
		query += ',"programSchedule.endDate":{$lte:' + parseInt(req.query.endDate);
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


// Cart
app.get('/api/cart', function(req,res){
	var cartEachTitle = '';
	var cartItem = []
	var arr = []
	var sch = {}
	var counter = 0;
	db.collection('mediaOwners').find({"username":req.user.username}).toArray(function(err,results1){
		var cartTitles = results1[0].cart;
		var count=cartTitles.length;
		for(var i=0;i<cartTitles.length;i++) {
			cartEachTitle = cartTitles[i].title;
			getCartPrice(cartEachTitle);
		}

		function getCartPrice(item) {
			db.collection('schedules').find({"createdBy": req.user.username}).toArray(function(err,results){
				if(results.length == 0) {
					res.status(404).send("No data found");
				} else if(err) {
					console.log(Err)
					res.status(500).send("Try Again");
				} else {
					counter = results.length
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
									counter--;
									if(count==0) {
										res.status(200).send({"data":arr});
									}
								}
							})
						}
					}
				}
			})
		}
	})
})


app.post('/api/bid',function(req,res){
	console.log(req.body.handler);
	db.collection('schedules').find({"handler":req.body.handler}).toArray(function(err,results){
		if(results == null || results.length ==0) {
			res.status(404).send("No Schedule Found");
		} else {
			currentTime = new Date().getTime();
			if(currentTime > results[0].auction.startDate && currentTime < results[0].auction.endDate) {
				db.collection('schedules').update({"handler":req.body.handler},{$push:{"bids":{"userId":"test","bidPrice":req.body.bidPrice}}},function(err,result){
					if(err) {
						res.status(500).send("Please try again");
					} else {
						res.status(200).send("Success");
					}
				})
			} else {
				res.status(200).send("Bids cannot be taken at this time");
			}
		}
	})
	//get user id, schedule handler, bid price

	//add an array bids with bid price and the user name to the specific schedule. 
})

app.get('/api/bid', function(req,res){
	db.collection('schedules').find({"handler":req.query.handler}).toArray(function(err,results){
		if(results == null || results.length ==0) {
			res.status(404).send("No Schedule Found");
		} else {
			var bidder = results[0].bids

			bidder.sort(function(a,b){
				return b.bidPrice - a.bidPrice;
			});

			res.status(200).send(bidder[0]);

		}
	})
	//req.query.scheduleTitle -> returns the best bidder name and th ebidder price.
})

