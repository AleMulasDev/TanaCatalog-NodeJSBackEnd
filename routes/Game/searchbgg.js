var express = require('express');
var router = express.Router();
var utils = require("../../utils/utils.js");
var {Game} = require("../../models/Game");
var bgg = require('../../utils/bgg');

//send list of games
router.get('/', async function(req, res, next) {
  let requestError = utils.checkRequest(req, 'query', 
  {name: 'search'});
  if(!requestError){
    bgg.search(req.query.search)
    .then(result => {
      res.json({
        status: 'ok',
        result
      })
    }).catch(err => {
      res.json({
        error: err.reason
      });
      utils.logDebug('search endpoint', `Bgg search: \n${err.debug?err.debug:err}`);
    })
  }else{
    res.json({error: requestError});
  }
});

module.exports = router;
