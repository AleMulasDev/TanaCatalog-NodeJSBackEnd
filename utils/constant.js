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
let BASE_PATH_GAMES = `${BASE_PATH}/games`;
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

const constant = {
  SERVER_ADDRESS,
  BASE_PATH,
  BASE_PATH_USERS,
  BASE_PATH_GAMES,
  LOGIN_PATH,
  REGISTER_PATH,
  RECOVER_PATH,
  VERIFY_PATH,
  CHANGE_PATH,
  CHANGE_EMAIL_PATH,
  MAIL_VERIFY_PATH,
  MAIL_RECOVER_PATH,
  MYSQL_ADDRESS,
  FROM_EMAIL_ADDRESS
};

module.exports = constant;
