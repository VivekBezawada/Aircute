var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var MongoClient = require('mongodb').MongoClient;
var dbConnection = 'mongodb://epskip:smalley009@ds149030.mlab.com:49030/aircute'

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.engine('html', require('hbs').__express);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
//app.use(cookieParser());
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
	res.render('homepage', { layout:'layouts/admin', title: 'Home Page | Aircute'});
})

//0. Enf of HomePage

//1. Authentication

app.get('/signup', function(req,res){
	res.render('signup', { layout:null, title: 'Signup | Aircute'});
})

//GET Request - Signup for the Client
app.get('/signUpMediaOwner', function(req,res){
	res.render('signupMedia', { layout:null, title: 'Signup Media Owners | Aircute'});
})

// POST Request - Signup for the Client
app.post('/signUpMediaOwner', function(req,res){
	var mediaLogo = '/logo/'
	var resigter = {"TimeStamp": new Date(),"mediaName":req.body.mediaName, "phoneNumber":req.body.phoneNumber, "emailAddress":req.body.emailAddress, "address":req.body.address, "username":req.body.username, "password":req.body.password, "mediaLogo":req.body.mediaLogo}
	db.collection('mediaOwners').insert(register, {w:1}, function(err,result){
		res.redirect('/')
	})
})

//GET Request - Signup User
app.get('/signUpUser', function(req,res){
	res.render('signupuser', { layout:null, title: 'Signup | Aircute'});
})

//POST Request - Signup User
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

//POST Request - Login Media Owner
app.post('/signinMediaOwner', function(req,res){
	db.collection('mediaOwners').find({$and: [{"userName":userName}, {"password":password}]}).count(function(err, count){
		if(count == 1) {
				res.send("YOU ARE NOW LOGGED IN AS MEDIA OWNER")
			}
	})
})

app.get('/signinUser', function(req,res){
	res.render('signinUser', { layout:null, title: 'Signin as a User | Aircute'});
})

//POST Request - Login Media Owner
app.post('/signinMediaOwner', function(req,res){
	db.collection('users').find({$and: [{"userName":userName}, {"password":password}]}).count(function(err, count){
		if(count == 1) {
				res.send("YOU ARE NOW LOGGED IN AS A USER")
			}
	})
})
//1. End of Authentication

// 2. Listing and Detail Pages

app.get('/listing', function(req,res){
	var passData = {}
	passData.layout = 'layouts/admin'
	passData.title =  'Listing | Aircute'
	
	//db.collection('listings').find().toArray(function(err, result){

	//})

	res.render('listings', passData)
	// some db operation to get the results
})

app.get('/listing/:id', function(req,res){
	// id is a title
	res.send("DETAILS PAGE")
})

// Single listing
