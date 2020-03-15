var mysql = require("mysql");
const constant = require("./constant");
const secrets = require("./_secrets");
let {GameQuery, Game} = require("../models/Game");

function _initConnection() {
  return mysql.createConnection({
    host: constant.MYSQL_ADDRESS,
    user: secrets.MYSQL_USERNAME,
    password: secrets.MYSQL_PASSWORD,
    database: "tanagoblin"
  });
}

//---------------------------------------------------------
//                          USERS
//---------------------------------------------------------

async function _login(email) {
  let connection = _initConnection();
  return new Promise((resolve, reject) => {
    connection.connect();
    connection.query(
      `SELECT id,email, password, firstname, lastname FROM users WHERE email=? and verified=true`,
      [email],
      (error, results, fields) => {
        if (error) {
          //Mysql error
          reject({
            reason: "Errore interno al server, riprova più tardi",
            debug: `[MYSQL] Error in the login: ${error}`
          })
        } else {
          if (results.length != 1) {
            reject({
              reason: "Email o password errati. Assicurati anche di aver verificato la mail prima di loggare",
              debug: "[MYSQL] Not exactly one result: obtained " + results.length
            });
          } else {
            resolve({
              id: results[0]["id"],
              email: results[0]["email"],
              password: results[0]["password"]
            });
          }
        }
      }
    );
  });
}

async function _updateEmail(oldEmail, newEmail){
  let connection = _initConnection();
  connection.connect();
  return new Promise((resolve, reject) => {
    connection.query(`\
    UPDATE users SET email = ?, verified = false WHERE email = ?`,
    [newEmail, oldEmail],
    (error, results, fields) => {
      if(!error){
        resolve();
      }else{
        reject({
          reason: "Errore interno al server, riprova più tardi",
          debug: `[MYSQL] Error in the updateEmail: ${error}`
        })
      }
    })
  })
}

async function _register(email, password, firstname, lastname){
  let connection = _initConnection();
  connection.connect();
  return new Promise((resolve, reject) => {
    connection.query(
    `INSERT INTO users (email, password, firstname, lastname) \
    VALUES (?, ?, ?, ?)`,
    [email, password, firstname, lastname],
    (error, results, fields) => {
      if(!error){
        resolve(results.insertId);
      }else{
        //error executing query
        reject({
          reason: "Errore interno al server, riprova più tardi",
          debug: `[MYSQL] Error in the register: ${error}`
        })
      }
    });//end of query
  });//end of promise
}

async function _mailExist(email){
  return new Promise((resolve, reject) => {
    let connection = _initConnection();
    connection.connect();
    connection.query(
    `SELECT id FROM users WHERE email=?`,
    [email],
    (error, results, fields) => {
      if(!error){
        if(results.length == 0){
          resolve(false);
        }else{
          resolve(true);
        }
      }else{
        //error executing query
        reject({
          reason: "Errore interno al server, riprova più tardi",
          debug: `[MYSQL] Error in the mailExist: ${error}`
        })
      }
    });//end of query
  });
}

async function _getUserId(email){
  return new Promise((resolve, reject) => {
    let connection = _initConnection();
    connection.connect();
    connection.query(
    `SELECT id FROM users WHERE email=?`,
    [email],
    (error, results, fields) => {
      if(!error){
        resolve(results[0]['id']);
      }else{
        //error executing query
        reject({
          reason: "Errore interno al server, riprova più tardi",
          debug: `[MYSQL] Error in the getUserId: ${error}`
        })
      }
    });//end of query
  });//end of promise
}

function _verify(userID){
  let connection = _initConnection();
  connection.connect();
  return new Promise((resolve, reject) => {
    connection.query(`\
    UPDATE users SET verified = true WHERE id = ?`,
    [userID],
    (error, results, fields) => {
      if(!error){
        if(results.affectedRows === 1){
          resolve(results.insertId);
        }else{
          reject({
            // It MUST be alredy verified since the id comes from an encrypted token and
            // therefore it's trusted
            reason: "Mail già verificata",
            debug: "[MYSQL] More or less than 1 row affected " + results.affectedRows
          })
        }
      }else{
        reject({
          reason: "Errore interno al server, riprova più tardi",
          debug: `[MYSQL] Error in the verify: ${error}`
        })
      }
    })
  })
}

function _mailExistAndVerified(email){
  let connection = _initConnection();
  connection.connect();
  return new Promise((resolve, reject) => {
    connection.query(`\
    SELECT id, email FROM users WHERE email=? AND verified=true`,
    [email],
    (error, results, fields) => {
      if(!error){
        if(results[0]['email'] == email){
          resolve(results[0]['id']);
        }else{
          reject({
            reason: "Email inesistente o non verificata",
            debug: `[MYSQL] Received invalid email: Received: ${email}\nSQL: ${results[0]['email']}`
          })
        }
      }else{
        reject({
          reason: "Errore interno al server, riprova più tardi",
          debug: `[MYSQL] Error in the mailExistAndVerified: ${error}`
        })
      }
    })
  })
}

function _updatePassword(id, password){
  let connection = _initConnection();
  connection.connect();
  return new Promise((resolve, reject) => {
    connection.query(`\
    UPDATE users SET password=? WHERE id=?`,
    [password, id],
    (error, results, fields) => {
      if(!error){
        connection.query(`\
        SELECT email FROM users WHERE id=?`,
        [id],
        (error2, results2, fields2) =>{
          if(!error2 && results2[0]['email']){
            resolve(results2[0]['email']);
          }else{
            reject({
              reason: "Errore interno al server, riprova più tardi",
              debug: `[MYSQL] Error in the second query of updatePassword:\n${error2}\nresult: ${results2[0]['email']}`
            })
          }
        });//end second query
      }else{
        reject({
          reason: "Errore interno al server, riprova più tardi",
          debug: `[MYSQL] Error in the first query of updatePassword:\n${error}`
        })
      }
    })
  })
}

//---------------------------------------------------------
//                          GAME
//---------------------------------------------------------

async function _gameList(){
  return new Promise((resolve, reject) => {
    let connection = _initConnection();
    connection.connect();
    connection.query(
    `SELECT id, title, link_tdg, players, playtime, age, gamebgg_id FROM game`,
    (error, results, fields) => {
      if(!error){
        let games = new Array();
        for(result of results){
          games.push(new GameQuery(result));
        }
        resolve(games);
      }else{
        //error executing query
        reject({
          reason: "Errore interno al server, riprova più tardi",
          debug: "[MYSQL] Error executing gamelist query" + error
        });
      }
    });//end of query
  });//end of promise
}

async function _addGame(game){
  return new Promise((resolve, reject) => {
    let connection = _initConnection();
    connection.connect();
    connection.query(
    `INSERT INTO game (title, link_tdg, players, playtime, age, gamebgg_id) VALUES (?,?,?,?,?,?)`,
    [game.title, game.link_tdg, game.players, game.playtime, game.age, game.gamebgg_id],
    (error, results, fields) => {
      if(!error){
        if(results.affectedRows === 1){
          resolve(results.insertId);
        }else{
          reject({
            reason: "Errore interno al server, riprova più tardi",
            debug: "[MYSQL] More or less than 1 row affected " + results.affectedRows
          })
        }
      }else{
        //error executing query
        reject({
          reason: "Errore interno al server, riprova più tardi",
          debug: "[MYSQL] Error executing insert game query" + error
        });
      }
    });//end of query
  });//end of promise
}

const SQL = {
  login: _login,
  register: _register,
  getUserId: _getUserId,
  verify: _verify,
  mailExistAndVerified: _mailExistAndVerified,
  updatePassword: _updatePassword,
  updateEmail: _updateEmail,
  mailExist: _mailExist,
  addGame: _addGame,
  gameList: _gameList
};

module.exports = SQL;
