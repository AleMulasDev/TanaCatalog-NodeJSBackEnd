var express = require('express');
var router = express.Router();
var utils = require("../../utils/utils.js");
var {Game} = require("../../models/Game");
var bgg = require('../../utils/bgg');

//send list of games
router.get('/', async function(req, res, next) {
  let requestError = utils.checkRequest(req, 'query', 
  {name: 'bggid', isBggId: true});
  if(!requestError){
    bgg.fetch(req.query.bggid)
    .then(result => {
      res.json({
        status: 'ok',
        result
      })
    }).catch(err => {
      res.json({
        error: err.reason
      });
      utils.logDebug('fetch endpoint', `Bgg fetch: \n${err.debug?err.debug:err}`);
    })
  }else{
    res.json({error: requestError});
  }
});

module.exports = router;
