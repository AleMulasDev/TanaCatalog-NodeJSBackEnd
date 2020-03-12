var express = require("express");
var router = express.Router();
const bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");
var fs = require("fs");
var SQL = require("../../utils/sql");
var moment = require("moment");
var mail = require("../../utils/mail");
const utils = require("../../utils/utils");


async function verifyEmail(email, redirect){
  return new Promise((resolve, reject) => {
    SQL.getUserId(email).then(userID => {
      let now = moment();
      let expirDate = now.add(1, "h");
      let jsExpirDate = expirDate.toDate();
      let toTokenize = {
        id: userID,
        expiration: jsExpirDate.toISOString()
      };
      fs.readFile("_keys/jwtRS256.key", (err, privkey) => {
        if (!err) {
          jwt.sign( toTokenize, privkey, { algorithm: "RS256" }, (err, token) => {
              if(err){
                reject(err);
              }
              if(redirect){
                mail.confirmMail(email, token, redirect);
                resolve({
                  status: "ok",
                  success: `Registrato con successo, controlla la tua email`
                })
              }else{
                mail.confirmMail(email, token);
                resolve({
                  status: "ok",
                  success: `Registrato con successo, controlla la tua email`
                })
              }
              
            }
          );
        } else {
          reject(err);
        }
      });
    }).catch(err => {
      reject(err);
    })
  })
}

router.post("/", async function(req, res, next) {

  let requestError = utils.checkRequest(req, 'body', 
    {name:'oldEmail',isEmail:true},
    {name:'newEmail',isEmail:true},
    {name:'password',isPassword:true});
    
  if (!requestError) {
    let password = req.body.password;
    let oldEmail = req.body.oldEmail;
    let newEmail = req.body.newEmail;
    SQL.login(oldEmail)
      .then(async value => {
        try{
          let mailAlredyExist = await SQL.mailExist(newEmail);
          if(!mailAlredyExist){
            //New mail doesn't exist
            bcrypt.compare(password, value.password, (err, same) => {
              if (!err) {
                if (same) {
                  //same password
                  SQL.updateEmail(oldEmail, newEmail).then(async ()=>{
                    try{
                      await verifyEmail(newEmail, req.body.redirect ? req.body.redirect : undefined);
                      res.json({
                        status: "ok"
                      })
                    }catch(err){
                      console.error(`Verify email error: \n${err}`);
                      res.json({
                        error: "Errore interno al server, riprova più tardi"
                      })
                    }
                  }).catch(err=>{
                    // SQL update email error
                    console.error(`SQL update email error: \n${err}`);
                    res.json({
                      error: 'Errore interno al server, riprova più tardi'
                    });
                  })
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
          }else{
            res.json({
              error: "La nuova mail è già in uso"
            });
          }
        }catch(err){
          console.error(`Mail alredy Exist error: \n${err}`);
          res.json({
            error: 'Errore interno al server, riprova più tardi'
          })
        }
      })
      .catch(err => {
        console.error(`SQL login error: \n${err}`);
        res.json({
          error: 'Errore interno al server, riprova più tardi'
        });
      })
  } else {
    res.json({
      error: requestError
    });
  }
});

module.exports = router;
