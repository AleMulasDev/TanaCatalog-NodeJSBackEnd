var express = require("express");
var router = express.Router();
const bcrypt = require("bcrypt");
var SQL = require("../../utils/sql");
const utils = require("../../utils/utils");


router.post("/", async function(req, res, next) {
  let email = req.body.email ? req.body.email : undefined;
  if(req.body.token && !email){
    try{
    let user = await utils.retrieveUser(req.body.token);
    let email = user.email
    }catch(err){
      utils.logDebug('change endpoint',err.debug);
      res.json({
        error: err
      });
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
                        success: `Password aggiornata con successo per la mail: ${value}`
                      });
                    })
                    .catch(err => {
                      //sql update password error
                      res.json({
                        error: err.reason
                      });
                      utils.logDebug('change endpoint', err.debug);
                    });
                } else {
                  //bcrypt hash error
                  res.json({
                    error: 'Errore interno al server, riprova più tardi'
                  });
                  utils.logDebug('change endpoint', `Brypt hash: \n${err}`);
                }
              });
            } else {
              //Password doesn't match
              res.json({
                error: "La vecchia password è sbagliata"
              });
              utils.logDebug('change endpoint', `Password doesn't match`);
            }
          } else {
            res.json({
              error: 'Errore interno al server, riprova più tardi'
            });
            utils.logDebug('change endpoint', `Brypt compare: \n${err}`);
          }
        });
      })
      .catch(err => {
        res.json({
          error: err.reason
        });
        utils.logDebug('change endpoint', `SQL login: \n${err.debug}`);
      });
  } else {
    res.json({
      error: requestError
    });
  }
});

module.exports = router;
