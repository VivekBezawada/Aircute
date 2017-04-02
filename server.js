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



app.get('/', function(req,res){
	res.send("HOMEPAGE");
	//res.render('main', { layout:'layouts/admin', title: 'Express'});
})

//GET Request - Signup for the Client
app.get('/signUpMediaOwner', function(req,res){
	res.render('signup', { layout:null, title: 'Signup | Aircute'});
})

// POST Request - Signup for the Client
app.post('/signUpMediaOwner', function(req,res){
	/*
	var mediaName
	phoneNumber
	emailAddress
	Address
	username
	password
	confirmPassword
	mediaLogo
	*/
})

//GET Request - Signup User
app.get('/signUpUser', function(req,res){
	res.render('signup', { layout:null, title: 'Signup | Aircute'});
})

//POST Request - Signup User
app.post('/signUpUser', function(req,res){
	/*
	var username
	password
	emailAddress
	*/
})

// GET Request - Login Media owner
app.get('/signinMediaOwner', function(req,res){
	res.render('signin', { layout:null, title: 'Signin | Aircute'});
})

//POST Request - Login Media Owner
app.post('/signinMediaOwner', function(req,res){
	/*
	var username
	password
	*/
})

