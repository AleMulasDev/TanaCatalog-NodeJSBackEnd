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
                SQL.verify(decoded.id).then(() => {
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
                }).catch(err => {
                  //sql verify error
                  res.json({
                    error: error.reason
                  });
                  utils.logDebug('verify endpoint', `Sql verify error: \n${err.debug}`);
                })
                
              }else{
                //expired token
                res.json({
                  error: 'Ricevuta chiave di sessione scaduta'
                });
                utils.logDebug('verify endpoint', `expired token`);
              }
            }else{
              //bad token
              res.json({
                error: 'Ricevuta chiave di sessione errata'
              });
              utils.logDebug('verify endpoint', `bad token received ${JSON.stringify(decoded)}`);
            }
          }else{
            //jwt verify error
            res.json({
              error: 'Errore interno al server, riprova più tardi'
            });
            utils.logDebug('verify endpoint', `jwt verify error: \n${err}`);
          }
        })
      }else{
        //pubkey read error
        res.json({
          error: 'Errore interno al server, riprova più tardi'
        });
        utils.logDebug('verify endpoint', `pubkey read error: \n${err}`);
      }
    })
  }else{
    res.json({
      error: requestError
    })
  }
})

module.exports = router;
