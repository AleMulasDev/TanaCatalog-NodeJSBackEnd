var express = require("express");
var router = express.Router();
const bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");
var fs = require("fs");
var SQL = require("../../utils/sql");
var moment = require("moment");
const utils = require("../../utils/utils");

router.post("/", function(req, res, next) {

  let requestError = utils.checkRequest(req, 'body', 
  {name:'email',isEmail:true},
  {name:'password',isPassword:true});
  if (!requestError) {
    SQL.login(req.body.email)
      .then(value => {
        let database = {
          id: value.id,
          email: value.email,
          password: value.password
        };
        bcrypt.compare(req.body.password, database.password, (err, result) => {
          if (!err) {
            if (result) {
              //password correct
              // generate, sign and send jwt
              fs.readFile("_keys/jwtRS256.key", (err, privkey) => {
                if (!err) {
                  let now = moment();
                  let expirDate = now.add(1, "w");
                  let jsExpirDate = expirDate.toDate();
                  let user = { id: database.id, email: database.email, expiration: jsExpirDate.toISOString() };
                  jwt.sign(user, privkey, { algorithm: "RS256" }, (err, token) => {
                    if (!err) {
                      res.json({
                        status: 'ok',
                        token: token
                      });
                    } else {
                      // error signing the jwt
                      res.json({
                        error: 'C\'è stato un problema interno nel server'
                      });
                      utils.logDebug('login endpoint', `Error signing the jwt: \n${err}`);
                    }
                  });
                } else {
                  // error reading private key's file
                  res.json({
                    error: 'C\'è stato un problema interno nel server'
                  });
                  utils.logDebug('login endpoint', `Error reading key: \n${err}`);
                }
              });
            } else {
              // password incorrect
              res.json({
                error: 'Password errata'
              });
              utils.logDebug('login endpoint', `Password doesn't match`);
            }
          } else {
            // BCrypt compare error
            res.sendStatus(500);
            res.json({
              error: 'Errore interno al server, riprova più tardi'
            });
            utils.logDebug('login endpoint', `Bcrypt compare error: \n${err}`);
          }
        });
      })
      .catch(err => {
        //sql login error
        res.json({
          error: err.reason
        });
        utils.logDebug('login endpoint', `Sql login error: \n${err.debug}`);
      });
  } else {
    res.json({error: requestError});
  }
});

module.exports = router;
