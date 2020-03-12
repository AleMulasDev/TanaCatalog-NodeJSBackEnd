var express = require("express");
var router = express.Router();
const bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");
var fs = require("fs");
var SQL = require("../../utils/sql");
var moment = require("moment");
const utils = require("../../utils/utils");

async function retrieveEmail(token){
  return new Promise((resolve, reject) => {
    fs.readFile('_keys/jwtRS256.key.pub', (err, pubKey) => {
      if(!err){
        jwt.verify(token, pubKey, (err, decoded) =>{
          if(!err){
            if(decoded.id && decoded.expiration){
              let exp = moment(decoded.expiration);
              let now = moment();
              if(now.isBefore(exp)){
                resolve(decoded.email);
              }else{
                //expired token
                reject({
                  error: 'La tua sessione è scaduta, rilogga'
                })
              }
            }
          }else{
            reject({
              error: 'Ricevuta chiave di sessione errata'
            })
          }
        })
      }else{
        reject({
          error: 'Errore interno al server, riprova più tardi'
        })
      }
    })
  })
}

router.post("/", async function(req, res, next) {
  let email = req.body.email ? req.body.email : undefined;
  if(req.body.token && !email){

    let token = req.body.token;

    try{
    email = await retrieveEmail(token);
    }catch(err){
      console.error(err);
      res.json(err);
    }

  }
  req.body.email = email;
  
  let requestError = utils.checkRequest(req, 'body', 
  {name:'email',isEmail:true},
  {name:'oldPassword',isPassword:true},
  {name:'newPassword',isPassword:true});
  if (!requestError) {
    let oldPassword = req.body.oldPassword;
    let newPassword = req.body.newPassword;
    SQL.login(email)
      .then(value => {
        bcrypt.compare(oldPassword, value.password, (err, same) => {
          if (!err) {
            if (same) {
              //same old password
              bcrypt.hash(newPassword, 10, (err, encrypted) => {
                if (!err) {
                  SQL.updatePassword(value.id, encrypted)
                    .then(value => {
                      res.json({
                        status: 'ok',
                        success: `Password aggiornata con successo per la mail: ${value}`,
                        email: value
                      });
                    })
                    .catch(err => {
                      //sql update password error
                      res.json({
                        error: 'Errore interno al server, riprova più tardi'
                      });
                    });
                } else {
                  //bcrypt hash error
                  res.json({
                    error: 'Errore interno al server, riprova più tardi'
                  });
                }
              });
            } else {
              //Password doesn't match
              res.json({
                error: "La vecchia password è sbagliata"
              });
            }
          } else {
            res.json({
              error: 'Errore interno al server, riprova più tardi'
            });
          }
        });
      })
      .catch(err => {
        res.json({
          error: err.reason
        });
      });
  } else {
    res.json({
      error: requestError
    });
  }
});

module.exports = router;
