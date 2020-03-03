var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
// var logger = require('morgan');
var bodyParser = require("body-parser");
var cors = require("cors");

var loginRouter = require("./routes/Users/login");
var registerRouter = require("./routes/Users/register");
var verifyRouter = require("./routes/Users/verify");
var recoverRouter = require("./routes/Users/recover");
var changeRouter = require("./routes/Users/change");

const constant = require("./utils/constant");

var app = express();

// app.use(logger('dev'));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

var whitelist = [
  'http://127.0.0.1:4200',
  'http://localhost:4200'
];
var corsOptions = {
  origin: function(origin, callback){
    var originIsWhitelisted = whitelist.indexOf(origin) !== -1;
    callback(null, originIsWhitelisted);
  },
  credentials: true
};
app.use(cors(corsOptions));

app.use(constant.LOGIN_PATH, loginRouter);
app.use(constant.REGISTER_PATH, registerRouter);
app.use(constant.VERIFY_PATH, verifyRouter);
app.use(constant.RECOVER_PATH, recoverRouter);
app.use(constant.CHANGE_PATH, changeRouter);

console.log("Listening on: " + constant.LOGIN_PATH);
console.log("Listening on: " + constant.REGISTER_PATH);
console.log("Listening on: " + constant.VERIFY_PATH);
console.log("Listening on: " + constant.RECOVER_PATH);
console.log("Listening on: " + constant.CHANGE_PATH);

module.exports = app;
