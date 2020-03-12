var express = require("express");
var router = express.Router();
var jwt = require("jsonwebtoken");
var moment = require('moment');
var fs = require('fs');
var SQL = require("../../utils/sql");
const utils = require("../../utils/utils");

router.get('/', (req, res, next) => {
  let requestError = utils.checkRequest(req, 'query', 
  {name:'token'});
  if (!requestError) {
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
                //TODO then/catch
                if(req.query.redirect){
                  let redirect = decodeURIComponent(req.query.redirect);
                  redirect = redirect.indexOf('http') >= 0 ? redirect : `http://${redirect}`;
                  res.writeHead(302, {
                    'Location': redirect
                  });
                  res.end();
                }else{
                  res.send("Mail verified correctly");
                }
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

module.exports = router;
