var express = require("express");
var router = express.Router();
const bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");
var fs = require("fs");
var SQL = require("../../utils/sql");

router.post("/", function(req, res, next) {
  var passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  var emailRegex = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
  if (
    req.body.oldPassword &&
    req.body.newPassword &&
    req.body.email &&
    // && passRegex.test(req.body.oldPassword)
    passRegex.test(req.body.newPassword) &&
    emailRegex.test(req.body.email)
  ) {
    let oldPassword = req.body.oldPassword;
    let newPassword = req.body.newPassword;
    let email = req.body.email;
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
                        Success: `Successfully update password for email ${value}`
                      });
                    })
                    .catch(err => {
                      //sql update password error
                      res.sendStatus(500);
                    });
                } else {
                  //bcrypt hash error
                  res.sendStatus(500);
                }
              });
            } else {
              //Password doesn't match
              res.json({
                Error: "Invalid old password"
              });
            }
          } else {
            //bcrypt compare error
            res.sendStatus(500);
          }
        });
      })
      .catch(err => {
        //sql login error
        res.sendStatus(500);
      });
  } else {
    //invalid data
    res.sendStatus(400);
  }
});

module.exports = router;
