var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.engine('html', require('hbs').__express);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
//app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req,res,next){

	res.render('main', { layout:'layouts/admin', title: 'Express'});
})

app.listen(8080,function(){
	console.log("serving")
})