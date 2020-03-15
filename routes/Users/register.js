var express = require("express");
var router = express.Router();
var SQL = require("../../utils/sql");
const bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");
var moment = require("moment");
var fs = require("fs");
var mail = require("../../utils/mail");
const utils = require("../../utils/utils");

router.post("/", function(req, res, next) {

  let requestError = utils.checkRequest(req, 'body', 
    {name:'firstname',isName:true},
    {name:'lastname',isName:true},
    {name:'email',isEmail:true},
    {name:'password',isPassword:true});
  if (!requestError) {
    bcrypt.hash(req.body.password, 10, (err, password) => {
      if (!err) {
        SQL.register(
          req.body.email,
          password,
          req.body.firstname,
          req.body.lastname
        ).then(() => {
          //If registered, get user id
          SQL.getUserId(req.body.email)
            .then(userID => {
              let now = moment();
              let expirDate = now.add(1, "h");
              let jsExpirDate = expirDate.toDate();
              let toTokenize = {
                id: userID,
                expiration: jsExpirDate.toISOString()
              };
              fs.readFile("_keys/jwtRS256.key", (err, privkey) => {
                if (!err) {
                  jwt.sign( toTokenize, privkey, { algorithm: "RS256" }, function(err, token) {
                    if(!err){
                      if(req.body.redirect){
                        mail.confirmMail(req.body.email, token, req.body.redirect);
                        res.json({
                          status: "ok",
                          success: `Registrato con successo, controlla la tua email`
                        })
                      }else{
                        mail.confirmMail(req.body.email, token);
                        res.json({
                          status: "ok",
                          success: `Registrato con successo, controlla la tua email`
                        })
                      }
                    }else{
                      //jwt sign error
                      res.json({
                        error: 'Errore interno al server, riprova più tardi'
                      });
                      utils.logDebug('register endpoint', `jwt sign error: \n${err}`);
                    }
                  });
                } else {
                  // privkey read error
                  res.json({
                    error: 'Errore interno al server, riprova più tardi'
                  });
                  utils.logDebug('register endpoint', `privkey read error: \n${err}`);
                }
              });
            }).catch(err => {
              //sql getUserId error
              res.json({
                error: error.reason
              });
              utils.logDebug('register endpoint', `Sql getUserId error: \n${err.debug}`);
            });
          }).catch(err => {
            //sql register error
            res.json({
              error: error.reason
            });
            utils.logDebug('register endpoint', `Sql register error: \n${err.debug}`);
          });
      } else {
        //bcrypt hash error
        res.json({
          error: 'Errore interno al server, riprova più tardi'
        });
        utils.logDebug('register endpoint', `bcrypt hash error: \n${err}`);
      }
    });
  } else {
    //invalid data
    res.json({
      error: requestError
    })
  }
});

module.exports = router;
