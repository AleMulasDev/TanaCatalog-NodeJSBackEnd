var express = require('express');
var router = express.Router();
var utils = require("../utils/utils.js");
var {Game} = require("../models/Game");
var SQL = utils.SQL;
const pathModule = require('path');
const sharp = require('sharp');
var {GamePermissions} = require('./../models/GamePermissions');

//send list of games
router.get('/', async function(req, res, next) {
  try{
    let gamesQuery;
    if(req.query.token){
      let user;
      try{
        user = await utils.retrieveUser(req.query.token);
      }catch(err){
        utils.logDebug('gamePUT endpoint', 'User token parsing: ' + (err.debug || err));
        res.json({error: err.reason ? err.reason : "Errore interno al server"})
        return;
      }

      gamesQuery = await SQL.gameListWithPermission(user.id);
    }else{
      gamesQuery = await SQL.gameList();
    }
    let games = new Array();
    for(let game of gamesQuery){
      games.push(new Game(game));
    }
    res.json({
      status: "ok",
      games: games
    });
  }catch(err){
    res.json({
      error: err.reason ? err.reason : "Errore interno al server"
    });
    utils.logDebug('gameGET endpoint', err.debug || err);
  }
});

//add new game
router.put('/', async function(req, res, next) {
  let requestError = utils.checkRequest(req, 'body', 
    {name: 'title', isGame: true},
    {name: 'token'}
  );
  if(!requestError){
    let user;
    try{
      user = await utils.retrieveUser(req.body.token);
    }catch(err){
      utils.logDebug('gamePUT endpoint', 'User token parsing: ' + (err.debug || err));
      res.json({error: err.reason ? err.reason : "Errore interno al server"})
      return;
    }
    
    let game = new Game(req.body);    
    let permission = new GamePermissions();
    permission.ownerID = user.id;
    try{
      console.log(req.body.canUpdateGame);
      if(req.body.canUpdateGame != undefined){
        if(req.body.canUpdateGame == "false"){
          permission.canUpdateGame = 0;
        }else{
          permission.canUpdateGame = 1;
        }
      }else{
        permission.canUpdateGame = 1;
      }
    }catch(err){
      utils.logDebug('gamePUT endpoint', 'Permission retrieving: ' + (err.debug || err));
      res.json({error: err.reason ? err.reason : "Errore interno al server"})
      return;
    }

    try{
      let checkGame;
      if(req.body.id){
        checkGame = await SQL.getGame(req.body.id)
      }
      if(checkGame){
        permission.gameID = req.body.id;
        try{
          let permissionOBJ = await SQL.getGamePermission(req.body.id);
          let permission = new GamePermissions(permissionOBJ);
          if(permission.ownerID != user.id || !permission.canUpdateGame){
            res.json({
              error: 'Non disponi dei permessi necessari'
            })
            return;
          }
        }catch(err){
          utils.logDebug('gamePUT endpoint', 'Checking permissions ' + (err.debug || err));
          res.json({error: err.reason ? err.reason : "Errore interno al server"})
          return;
        }

        // update existing game
        await SQL.updateGame(req.body.id, game);
        await SQL.setGamePermission(permission);
        res.json({
          status: "ok"
        })
        utils.logInteraction('GameUpdate', `${user.email} modified a game`);
        return;
      }
    }catch(err){
      utils.logDebug('gamePUT endpoint', 'Checking if alredy exist ' + (err.debug || err));
      res.json({error: err.reason ? err.reason : "Errore interno al server"})
      return;
    }

    let imagePath;
    if(req.files && req.files.image){
      try{
        imagePath = await handleImageUpload(req);
        game.image = imagePath.image;
        game.thumbnail = imagePath.thumbnail;
      }catch(err){
        utils.logDebug('gamePUT endpoing', `File uploader: ${err.debug || err.error || err}`);
        res.json(err);
        return;
      }
    }
    try{
      let gameID = await SQL.addGame(game);
      permission.gameID = gameID;
      let success = await SQL.addGamePermission(permission);
      res.json({
        status: "ok"
      })
      utils.logInteraction('GameAdd', `${user.email} added a game`);
    }catch(err){
      utils.logDebug('gamePUT endpoint', err.debug || err);
      res.json({error: err.reason ? err.reason : "Errore interno al server"});
    }
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
    try{
      let user = await utils.retrieveUser(req.query.token);

      let isInUse = await SQL.gameIsUsed(req.query.id)
      if(!isInUse){
        let gameOBJ = await SQL.getGame(req.query.id);
        let game = new Game(gameOBJ);
        if(game === undefined){
          res.json({
            status: 'ok'
          })
          utils.logInteraction('gamedelete', `${user.email} tryed to delete a game which doesn't exist. id: ${req.query.id}`);
          return;
        }else{
          if(game.ownerID == user.id){
            await SQL.deleteGame(req.query.id);
            res.json({
              status: 'ok'
            })
            utils.logInteraction(user.email, `deleted game id: ${req.query.id}`);
            return;
          }else{
            res.json({
              error: 'Solo il creatore del gioco lo può cancellare'
            })
            utils.logDebug('gameDELETE endpoint', `User ${user.email} tried to delete game ${game.id} but he's not the owner`)
          }
        }
      }else{
        res.json({
          error: 'Impossibile rimuovere: Gioco in uso da una o più sezioni'
        })
        utils.logDebug('gameDELETE endpoint', `Gioco in uso`);
        return;
      }

    }catch(err){
      utils.logDebug('gameDELETE endpoint', `Errore generico: ${err.debug || err}`);
      res.json({error: err.reason ? err.reason : "Errore interno al server"});
    }
  }else{
    res.json({error: requestError});
  }
})


async function handleImageUpload(req){
  let imgType = /(jpg|png|jpeg)$/i;
  return new Promise((resolve, reject) => {
    if(!req.files.image.truncated){
      if(imgType.test(req.files.image.mimetype)){
        let img = req.files.image;
        let path = `/imagesUploaded/${img.md5}.${img.mimetype.replace('image/', '')}`;
        let filePath = pathModule.join(__dirname, path);
        let pathThumb = `/imagesUploaded/THUMB_${img.md5}.${img.mimetype.replace('image/', '')}`;
        let thumbFilePath = pathModule.join(__dirname, pathThumb);
        let imageData = img.data;
        sharp(imageData).resize(150,150).toFile(thumbFilePath, (errSharp, info) => {
          img.mv(filePath, err => {
            if(!err){
              if(!errSharp){
                utils.logInteraction('File uploader', 'Uploaded file to: ' + path);
                utils.logInteraction('File uploader', `Created thumnail to: ${pathThumb}`);
                resolve({
                  image: path,
                  thumbnail: pathThumb
                });
              }else{
                resolve({
                  image: path,
                  thumbnail: undefined
                });
                utils.logDebug(`image upload`, `Unable to create thumbnail: ${errSharp}`);
              }
            }else{
              reject({
                error: 'Errore interno al server elaborando l\'immagine',
                debug: `Error moving image: ${err}`
              });
            }
          })
        
        })
      }else{
        reject({error: 'Estensione dell\'immagine non accettata'});
      }
    }else{
      reject({error: 'File troppo grande'});
    }
  })
}

module.exports = router;
