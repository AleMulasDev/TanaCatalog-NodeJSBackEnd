var express = require("express");
var router = express.Router();
var SQL = require("../../utils/sql");
const bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");
var moment = require('moment');
var fs = require('fs');
var mail = require('../../utils/mail');
var generator = require('generate-password');


router.get("/", function (req, res, next) {
  let password = generator.generate({
    length: 10,
    numbers: true,
    uppercase: true
  });
  if(req.query.token){
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
                      mail.sendNewPassword(email, password);
                      res.send("Look at your inbox");
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
    res.sendStatus(400);
  }
})


router.post("/", function(req, res, next) {
  var emailRegex = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;

  if(req.body.email &&
    emailRegex.test(req.body.email)){
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
              mail.recoverPassword(req.body.email, token);
              res.send('Look at your mail inbox');
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
  }
})

module.exports = router;