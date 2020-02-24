var express = require("express");
var router = express.Router();
const bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");
var moment = require('moment');
var fs = require('fs');
var SQL = require("../../utils/sql");

router.get('/', (req, res, next) => {
  if(req.query.token){
    let token = req.query.token;
    fs.readFile('_keys/jwtRS256.key.pub', (err, pubKey) => {
      if(!err){
        jwt.verify(token, pubKey, (err, decoded) =>{
          if(!err){
            if(decoded.id && decoded.expiration){
              let exp = moment(decoded.expiration);
              let now = moment();
              if(now.isBefore(exp)){
                SQL.verify(decoded.id);
                res.send("Verified correctly");
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

module.exports = router;
