var express = require('express');
var router = express.Router();
var utils = require("../utils/utils.js");
var {Game} = require("../models/Game");
var SQL = utils.SQL;
const pathModule = require('path');
const sharp = require('sharp');

//send list of games
router.get('/', async function(req, res, next) {
  let requestError = utils.checkRequest(req, 'query', 
    {name: 'id'},
    {name: 'token'}
  );
  if(!requestError){
    
  }else{
    res.json({error: requestError});
  }
});

//add new game
router.put('/', async function(req, res, next) {
  let requestError = utils.checkRequest(req, 'body', 
    {name: 'title', isName: true},
    {name: 'token'}
  );
  if(!requestError){

  }else{
    res.json({error: requestError});
  }
});

router.delete('/', async function(req, res, next) {
  let requestError = utils.checkRequest(req, 'query', 
    {name: 'id'},
    {name: 'token'}
  );
  if(!requestError){
    
  }else{
    res.json({error: requestError});
  }
})

module.exports = router;
