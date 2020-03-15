const constants = require("./constant");
const mail = require("./mail.js");
const SQL = require("./sql");
const bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");
var fs = require("fs");
var moment = require("moment");
const chalk = require('chalk');

const emailRegex = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()+_\-=}{[\]|:;"\/?.><,`~])[A-Za-z\d!@#$%^&*()+_\-=}{[\]|:;"\/?.><,`~]{8,}$/;
var nameRegex = /^[a-z ,.'-]+$/i;

const debug = process.env.debug ? process.env.debug : true;

let utils = {
  constants,
  mail,
  SQL,
  emailRegex,
  passRegex,
  nameRegex,
  checkRequest,
  retrieveUser,
  logDebug,
  logInteraction,
  debug
}

/**
 * Check if a request contains the required parameters and if they respect the regular expression
 * @param {object} request - the request object that has the value to be checked
 * @param {string} check - body or query checking
 * @param {object} parameters_to_check - parameters to check, with additional information
 * @param {string} parameters_to_check.name - name of the parameter to check
 * @param {boolean} parameters_to_check.isEmail - true if it's an email and need the regex to be checked
 * @param {boolean} parameters_to_check.isPassword - true if it's a password and need the regex to be checked
 * @param {boolean} parameters_to_check.isName - true if it's a name and need the regex to be checked
 * @returns {string} - contains the error, if any
 */
function checkRequest(request, check, ...parameters_to_check){
  let r = request;
  check = check === 'body' || check === 'query' ? check : 'body';
  let error;

  for(p of parameters_to_check){
    if(!p.name || !r[check][p.name]){
      let e = 'Non tutti i parametri necessari sono stati compilati e/o inviati al server';
      console.log(`name: ` + p.name)
      error = error ? error += `\n${e}` : e;
      break;
    }
    if(p.isEmail){  //if it's an email, it needs regex checking
      if(!emailRegex.test(r[check][p.name])){
        let e = 'L\'email inserita non è corretta';
        error = error ? error += `\n${e}` : e;
        break;
      }
    }
    if(p.isPassword){   //if it's a password, it needs regex checking
      if(!passRegex.test(r[check][p.name])){
        let e = 'La password inserita non è corretta, controllare che abbia: Una maiuscola, una minuscola, un carattere speciale e un numero';
        error = error ? error += `\n${e}` : e;
        break;
      }
    }
    if(p.isName){   //if it's a name, it needs regex checking
      if(!nameRegex.test(r[check][p.name])){
        let e = 'Il nome inserito non è valido, i valori permessi sono: maiuscole, minuscole, virgola, punto, apostrofo e trattino';
        error = error ? error += `\n${e}` : e;
        break;
      }
    }
    if(p.isGame){
      //TODO
    }
  }

  return error;
}

/**
 * 
 * @param {string} token - Session's token 
 */
async function retrieveUser(token){
  return new Promise((resolve, reject) => {
    fs.readFile('_keys/jwtRS256.key.pub', (err, pubKey) => {
      if(!err){
        jwt.verify(token, pubKey, (err, decoded) =>{
          if(!err){
            if(decoded.id && decoded.expiration && decoded.email){
              let exp = moment(decoded.expiration);
              let now = moment();
              if(now.isBefore(exp)){
                resolve({
                  email: decoded.email,
                  id: decoded.id
                });
              }else{
                //expired token
                reject({
                  error: 'La tua sessione è scaduta, rilogga',
                  debug: 'Received expired token'
                })
              }
            }else{
              reject({
                error: 'Chiave di sessione errata o corrotta, rilogga',
                debug: 'Found token without the required parameters'
              })
            }
          }else{
            reject({
              error: 'Ricevuta chiave di sessione errata',
              debug: 'Failed to verify a token'
            })
          }
        })
      }else{
        reject({
          error: 'Errore interno al server, riprova più tardi',
          debug: 'Error reading public key\'s file'
        })
      }
    })
  })
}

function logDebug(caller, message){
  if(debug){
    console.log(chalk.white.bgRed.bold(`[${caller.toUpperCase()}]`) + " - " + chalk.red(message));
  }
}

function logInteraction(caller, interaction){
  console.log(chalk.white.bgBlue(`[${caller.toUpperCase()}]`) + " - " + chalk.cyanBright(interaction));
}

module.exports = utils;