var express = require("express");
var router = express.Router();
var SQL = require("../../utils/sql");
const bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");
var moment = require('moment');
var fs = require('fs');
var mail = require('../../utils/mail');
var generator = require('generate-password');
const utils = require("../../utils/utils");


router.get("/", function (req, res, next) {
  let password = generator.generate({
    length: 16,
    numbers: true,
    uppercase: true,
    lowercase: true,
    excludeSimilarCharacters: true,
    symbols: true,
    strict: true
  });
  let requestError = utils.checkRequest(req, 'query', 
  {name:'token'});
  if (!requestError) {
    let token = req.query.token;
    fs.readFile('_keys/jwtRS256.key.pub', (err, pubKey) => {
      if(!err){
        jwt.verify(token, pubKey, (err, decoded) =>{
          if(!err){
            if(decoded.recover_id && decoded.recover_expiration){
              let exp = moment(decoded.recover_expiration);
              let now = moment();
              if(now.isBefore(exp)){
                bcrypt.hash(password, 10, (err, encrypted) => {
                  if(!err){
                    SQL.updatePassword(decoded.recover_id, encrypted).then((email) =>{
                      if(req.query.redirect && req.query.redirect !== ''){
                        mail.sendNewPassword(email, password, req.query.redirect).then().catch();
                        let redirect = req.query.redirect;
                        redirect = redirect.indexOf('http') >= 0 ? redirect : `http://${redirect}`;
                        res.writeHead(302, {
                          'Location': redirect
                        });
                        res.end();
                      } else {
                        mail.sendNewPassword(email, password);
                        res.json({
                          'status': 'ok'
                        })
                      }
                    }).catch(err => {
                      console.error(err);
                      res.sendStatus(500);
                    })
                  }else{
                    res.sendStatus(500);
                  }
                })
              }else{
                //expired token
                res.send("Expired token");
              }
            }
          }else{
            res.sendStatus(400);
          }
        })
      }else{
        res.sendStatus(500);
      }
    })
  }else{
    res.json({
      error: requestError
    })
  }
})


router.post("/", function(req, res, next) {
  let requestError = utils.checkRequest(req, 'body', 
    {name:'email',isEmail:true});
  if (!requestError) {
    SQL.mailExistAndVerified(req.body.email).then((resultedID)=>{
      let now = moment();
      let expirDate = now.add(5, 'm');
      let jsExpirDate = expirDate.toDate();
      let toTokenize = {
        recover_id: resultedID,
        recover_expiration: jsExpirDate.toISOString()
      }
      fs.readFile("_keys/jwtRS256.key", (err, privkey) => {
        if (!err) {
          jwt.sign(toTokenize, privkey, { algorithm: "RS256" }, function(err, token) {
            if(!err){
              if(req.body.redirect && req.body.redirect !== ''){
                mail.recoverPassword(req.body.email, token, req.body.redirect).then().catch();
                res.json({
                  "status": "ok"
                })
              } else {
                mail.recoverPassword(req.body.email, token);
                res.json({
                  'status': 'ok'
                })
              }
            }else{
              res.sendStatus(500);
            }
          })
        }else{
          res.sendStatus(500);
        }
      })
    }).catch(err =>{
      console.error(err);
      res.send("Invalid email, make sure it's the right one and it was verified");
    })
  }else{
    res.json({
      error: requestError
    })
  }
})

module.exports = router;