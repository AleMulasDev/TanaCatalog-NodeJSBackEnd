var express = require('express');
var router = express.Router();
var utils = require("../utils/utils.js");
var {Game} = require("../models/Game");
var SQL = utils.SQL;

//send list of games
router.get('/', async function(req, res, next) {
  try{
    let games = await SQL.gameList();
    res.json({
      status: "ok",
      games: games
    });
  }catch(err){
    res.json({
      error: err.reason ? err.reason : "Errore interno al server"
    });
  }
});

//add new game
router.post('/', async function(req, res, next) {
  let requestError = utils.checkRequest(req, 'body', 
    {name: 'title', isGame: true},
    {name: 'token'}
  );
  if(!requestError){
    let user = await utils.retrieveUser(req.body.token);
    let game = new Game(req.body);
    try{
      let success = await SQL.addGame(game);
      //success contains the id of the new game if needed
      res.json({
        status: "ok"
      })
      logInteraction('GameAdd', `${user.email} added a game`);
    }catch(err){
      res.json({error: err.reason ? err.reason : "Errore interno al server"});
    }
  }else{
    res.json({error: requestError});
  }
});

module.exports = router;
