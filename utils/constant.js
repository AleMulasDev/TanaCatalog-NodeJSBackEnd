/*

ENVIRONMENT SETTINGS AVAILABLE: 
- BASE_PATH => change app's default base path
for example BASE_PATH = '/api' will set the app's listening from 127.0.0.1/api;
- FROM_EMAIL_ADDRESS => change email from which the api send mail to the user
for example FROM_EMAIL_ADDRESS = 'no-reply@example.com'

*/

let SERVER_ADDRESS = `localhost:4000`;
let BASE_PATH= process.env.BASE_PATH ? process.env.BASE_PATH : "/api/tana";
let BASE_PATH_USERS= `${BASE_PATH}/users`;
let LOGIN_PATH= `${BASE_PATH_USERS}/login`;
let REGISTER_PATH= `${BASE_PATH_USERS}/register`;
let RECOVER_PATH= `${BASE_PATH_USERS}/recover`;
let VERIFY_PATH= `${BASE_PATH_USERS}/verify`;
let CHANGE_PATH= `${BASE_PATH_USERS}/change`;
let CHANGE_EMAIL_PATH = `${BASE_PATH_USERS}/changeEmail`;
let MAIL_VERIFY_PATH= `http://${SERVER_ADDRESS}${VERIFY_PATH}`;
let MAIL_RECOVER_PATH= `http://${SERVER_ADDRESS}${RECOVER_PATH}`;
let MYSQL_ADDRESS= `192.168.99.100`;
let FROM_EMAIL_ADDRESS = process.env.FROM_EMAIL_ADDRESS ? process.env.FROM_EMAIL_ADDRESS : `no-reply@alessandro-mulas.it`;
let IMAGES_UPLOADED = `${BASE_PATH}/imagesUploaded/`;

let BASE_PATH_GAMES = `${BASE_PATH}/games`;
let SEARCHBGG_GAME_PATH = `${BASE_PATH}/searchBgg`;
let FETCHBGG_GAME_PATH = `${BASE_PATH}/fetchBgg`;

let BASE_PATH_SECTIONS = `${BASE_PATH}/sections`;
let HOLDER_PATH = `${BASE_PATH_SECTIONS}/holder`;
let SECTION_GAMES_PATH = `${BASE_PATH_SECTIONS}/game`;

const BGG_BASE_PATH = `http://boardgamegeek.com/xmlapi`;
const BGG_SEARCH_PATH = `${BGG_BASE_PATH}/search`;
const BGG_FETCHGAME_PATH = `${BGG_BASE_PATH}/boardgame/`;

const constant = {
  SERVER_ADDRESS,
  BASE_PATH,
  BASE_PATH_USERS,
  LOGIN_PATH,
  REGISTER_PATH,
  RECOVER_PATH,
  VERIFY_PATH,
  CHANGE_PATH,
  CHANGE_EMAIL_PATH,
  MAIL_VERIFY_PATH,
  MAIL_RECOVER_PATH,
  MYSQL_ADDRESS,
  FROM_EMAIL_ADDRESS,
  IMAGES_UPLOADED,

  BASE_PATH_GAMES,
  SEARCHBGG_GAME_PATH,
  FETCHBGG_GAME_PATH,

  BASE_PATH_SECTIONS,
  HOLDER_PATH,
  SECTION_GAMES_PATH,

  bgg: {
    BGG_BASE_PATH,
    BGG_SEARCH_PATH,
    BGG_FETCHGAME_PATH
  }
};

module.exports = constant;
