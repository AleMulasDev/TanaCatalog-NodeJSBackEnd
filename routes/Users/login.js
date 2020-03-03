var express = require("express");
var router = express.Router();
const bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");
var fs = require("fs");
var SQL = require("../../utils/sql");

router.post("/", function(req, res, next) {
  if (req.body.email && req.body.password) {
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
                  let user = { id: database.id, email: database.email };
                  jwt.sign(user, privkey, { algorithm: "RS256" }, function(
                    err,
                    token
                  ) {
                    if (!err) {
                      res.json({
                        token: token,
                        logged: true
                      });
                    } else {
                      // error signing the jwt
                      res.json({
                        token: null,
                        logged: false
                      });
                    }
                  });
                } else {
                  // error reading private key's file
                  res.json({
                    token: null,
                    logged: false
                  });
                }
              });
            } else {
              // password incorrect
              res.json({
                token: null,
                logged: false
              });
            }
          } else {
            res.sendStatus(500);
            return;
          }
        });
      })
      .catch(error => {
        console.error(error.debug);
        res.sendStatus(500);
        //TODO send error.reason to client
      });
  } else {
    res.sendStatus(400);
  }
});

module.exports = router;
