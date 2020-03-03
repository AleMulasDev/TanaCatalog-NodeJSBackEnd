var mysql = require("mysql");
const constant = require("./constant");
const secrets = require("./_secrets");

function _initConnection() {
  return mysql.createConnection({
    host: constant.MYSQL_ADDRESS,
    user: secrets.MYSQL_USERNAME,
    password: secrets.MYSQL_PASSWORD,
    database: "tanagoblin"
  });
}
function _login(email) {
  let connection = _initConnection();
  return new Promise((resolve, reject) => {
    var emailRegex = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;

    if (emailRegex.test(email)) {
      connection.connect();
      connection.query(
        `SELECT id,email, password, firstname, lastname FROM users WHERE email='${email}'`,
        (error, results, fields) => {
          if (error) {
            //Mysql error
            reject({
              reason: "Errore nella connessione al database interno",
              debug: `[MYSQL] ${error}`
            });
          } else {
            if (results.length != 1) {
              reject({
                reason: "Email o password errati",
                debug: "[MYSQL] More than one result"
              });
            } else {
              resolve({
                id: results[0]["id"],
                username: results[0]["email"],
                password: results[0]["password"]
              });
            }
          }
        }
      );
    } else {
      reject({
        reason: "Inserire una mail valida",
        debug: "[LOGIN] Username didn't match the regex"
      });
    }
  });
}

function _register(email, password, firstname, lastname){
  let connection = _initConnection();
  connection.connect();
  return new Promise((resolve, reject) => {
    connection.query(
    `INSERT INTO users (email, password, firstname, lastname) \
    VALUES ('${email}', '${password}', '${firstname}', '${lastname}')`,
    (error, results, fields) => {
      if(!error){
        resolve();
      }else{
        //error executing query
        console.log(`Error executing query: ${error}`)
        reject();
      }
    });//end of query
  });//end of promise
}

function _getUserId(email){
  var emailRegex = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
  return new Promise((resolve, reject) => {
    if (emailRegex.test(email)) {
      let connection = _initConnection();
      connection.connect();
      connection.query(
      `SELECT id FROM users WHERE email='${email}'`,
      (error, results, fields) => {
        if(!error){
          if(results.length == 0){
            reject('length');
          }else{
            resolve(results[0]['id']);
          }
        }else{
          //error executing query
          reject('Error executing query ' + error);
        }
      });//end of query
      
    }else{ //failed to test email
    }
  });//end of promise
}

function _verify(userID){
  let connection = _initConnection();
  connection.connect();
  return new Promise((resolve, reject) => {
    connection.query(`\
    UPDATE users SET verified = true WHERE id = ${userID}`,
    (error, results, fields) => {
      if(!error){
        resolve();
      }else{
        reject(error);
      }
    })
  })
}

function _mailExistAndVerified(email){
  let connection = _initConnection();
  connection.connect();
  return new Promise((resolve, reject) => {
    connection.query(`\
    SELECT id, email FROM users WHERE email='${email}' AND verified=true`,
    (error, results, fields) => {
      if(!error){
        if(results[0]['email'] == email){
          resolve(results[0]['id']);
        }else{
          reject("This email doesn't exist or isn't verified");
        }
      }else{
        reject(error);
      }
    })
  })
}

function _updatePassword(id, password){
  let connection = _initConnection();
  connection.connect();
  return new Promise((resolve, reject) => {
    connection.query(`\
    UPDATE users SET password='${password}' WHERE id=${id}`,
    (error, results, fields) => {
      if(!error){
        connection.query(`\
        SELECT email FROM users WHERE id=${id}`,
        (error2, results2, fields2) =>{
          if(!error2 && results2[0]['email']){
            resolve(results2[0]['email']);
          }else{
            reject(error2);
          }
        });//end second query
      }else{
        reject(error);
      }
    })
  })
}

const SQL = {
  login: _login,
  register: _register,
  getUserId: _getUserId,
  verify: _verify,
  mailExistAndVerified: _mailExistAndVerified,
  updatePassword: _updatePassword
};

module.exports = SQL;
