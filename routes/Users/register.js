var express = require("express");
var router = express.Router();
var SQL = require("../../utils/sql");
const bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");
var moment = require("moment");
var fs = require("fs");
var mail = require("../../utils/mail");

router.post("/", function(req, res, next) {
  var emailRegex = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
  var nameRegex = /^[a-z ,.'-]+$/i;

  //Minimum eight characters, at least one uppercase letter, one lowercase letter, one number and one special character:
  var passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  if (
    req.body.firstname &&
    req.body.lastname &&
    req.body.email &&
    req.body.password &&
    emailRegex.test(req.body.email) &&
    nameRegex.test(req.body.firstname) &&
    nameRegex.test(req.body.lastname) &&
    passRegex.test(req.body.password)
  ) {
    bcrypt.hash(req.body.password, 10, (err, password) => {
      if (!err) {
        SQL.register(
          req.body.email,
          password,
          req.body.firstname,
          req.body.lastname
        )
          .then(() => {
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
                    jwt.sign(
                      toTokenize,
                      privkey,
                      { algorithm: "RS256" },
                      function(err, token) {
                        mail.confirmMail(req.body.email, token);
                        res.send("Look at your mail inbox");
                      }
                    );
                  } else {
                    res.sendStatus(500);
                  }
                });
              })
              .catch(err => {
                res.sendStatus(500);
              });
          })
          .catch(err => {
            res.sendStatus(500);
          });
      } else {
        //error creating password's hash
        res.sendStatus(500);
      }
    }); //end of bcrypt hash function
  } else {
    //invalid data
    res.sendStatus(400);
  }
});

module.exports = router;
