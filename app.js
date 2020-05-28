var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require('morgan');
var bodyParser = require("body-parser");
var cors = require("cors");
var fileUpload = require("express-fileupload");


var loginRouter = require("./routes/Users/login");
var checkTokenRouter = require("./routes/Users//checkToken");
var registerRouter = require("./routes/Users/register");
var verifyRouter = require("./routes/Users/verify");
var recoverRouter = require("./routes/Users/recover");
var changeRouter = require("./routes/Users/change");
var changeEmailRouter = require("./routes/Users/changeEmail");

var imageRouter = require("./routes/imagesUploaded/getImages");


var gameRouter = require("./routes/game");
var searchbggRouter = require("./routes/game/searchbgg");
var fetchbggRouter = require("./routes/game/fetchbgg");

var sectionsRouter = require("./routes/section"); 
var holderRouter = require("./routes/section/holder");
var sectionGameRouter = require("./routes/section/game");
var sectionPermissionRouter = require("./routes/Section/permission");
var sectionUserRouter = require("./routes/Section/user");

const constant = require("./utils/constant");

var app = express();

app.use(logger('tiny'));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

let tempPath = path.join(__dirname, '/tmp/');

app.use(fileUpload({
  createParentPath: true,
  // useTempFiles : true,
  tempFileDir : tempPath,
  limits: { fileSize: 50 * 1024 * 1024 },
  // debug: true
}));

var whitelist = [
  'http://127.0.0.1:4200',
  'http://192.168.1.238:4200',
  'http://192.168.1.239:4200',
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
app.use(constant.TOKEN_CHECK_PATH, checkTokenRouter);
app.use(constant.REGISTER_PATH, registerRouter);
app.use(constant.VERIFY_PATH, verifyRouter);
app.use(constant.RECOVER_PATH, recoverRouter);
app.use(constant.CHANGE_PATH, changeRouter);
app.use(constant.CHANGE_EMAIL_PATH, changeEmailRouter);
app.use(constant.BASE_PATH_GAMES, gameRouter);
app.use(constant.SEARCHBGG_GAME_PATH, searchbggRouter);
app.use(constant.FETCHBGG_GAME_PATH, fetchbggRouter);
app.use(constant.BASE_PATH_SECTIONS, sectionsRouter);
app.use(constant.HOLDER_PATH, holderRouter);
app.use(constant.SECTION_GAMES_PATH, sectionGameRouter);
app.use(constant.SECTION_PERMISSION_PATH, sectionPermissionRouter);
app.use(constant.SECTION_USER_PATH, sectionUserRouter);

app.use(constant.IMAGES_UPLOADED, imageRouter);

console.log("Listening on: " + constant.LOGIN_PATH);
console.log("Listening on: " + constant.TOKEN_CHECK_PATH);
console.log("Listening on: " + constant.REGISTER_PATH);
console.log("Listening on: " + constant.VERIFY_PATH);
console.log("Listening on: " + constant.RECOVER_PATH);
console.log("Listening on: " + constant.CHANGE_PATH);
console.log("Listening on: " + constant.CHANGE_EMAIL_PATH);
console.log("Listening on: " + constant.BASE_PATH_GAMES);
console.log("Listening on: " + constant.SEARCHBGG_GAME_PATH);
console.log("Listening on: " + constant.FETCHBGG_GAME_PATH);
console.log("Listening on: " + constant.BASE_PATH_SECTIONS);
console.log("Listening on: " + constant.HOLDER_PATH);
console.log("Listening on: " + constant.SECTION_GAMES_PATH);
console.log("Listening on: " + constant.SECTION_PERMISSION_PATH);
console.log("Listening on: " + constant.GAME_PERMISSION_PATH);
console.log("Listening on: " + constant.SECTION_USER_PATH);

console.log("Listening on: " + constant.IMAGES_UPLOADED);

console.log("\nApi correctly started\n")

module.exports = app;
