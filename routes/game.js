var express = require('express');
var router = express.Router();
var utils = require("../utils/utils.js");
var {Game} = require("../models/Game");
var SQL = utils.SQL;
const pathModule = require('path');
const sharp = require('sharp');
var {GamePermissions, GamePermissionRequest} = require('./../models/GamePermissions');

//send list of games
router.get('/', async function(req, res, next) {
  let requestError = utils.checkRequest(req, 'query',
    {name: 'token'}
  );
  if(!requestError){
    try{
      let gamesQuery;
      let user;
      try{
        user = await utils.retrieveUser(req.query.token);
      }catch(err){
        utils.logDebug('gamePUT endpoint', 'User token parsing: ' + (err.debug || err));
        res.json({error: err.error ? err.error : "Errore interno al server"})
        return;
      }

      gamesQuery = await SQL.gameListWithPermission(user.id);
      
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
  }else{
    res.json({error: requestError});
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
      res.json({error: err.error ? err.error : "Errore interno al server"})
      return;
    }
    
    let game = new Game(req.body);    
    
    try{
      let checkGame;
      if(req.body.id){
        checkGame = await SQL.getGame(req.body.id, user.id)
      }
      if(checkGame){
        try{
          let permissionOBJ = await SQL.getGamePermission(req.body.id, user.id);
          let permission = new GamePermissions(permissionOBJ);
          if(!permission.canUpdateGame && !permission.isOwner){
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
    }//game does not exist

    let permission = new GamePermissionRequest();
    permission.userID = user.id;
    permission.isOwner = true;
    permission.canUpdateGame = true;
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
      let user;
      try{
        user = await utils.retrieveUser(req.query.token);
      }catch(err){
        utils.logDebug('gameDELETE endpoint', 'User token parsing: ' + (err.debug || err));
        res.json({error: err.error ? err.error : "Errore interno al server"})
        return;
      }

      let isInUse = await SQL.gameIsUsed(req.query.id)
      if(!isInUse){
        let gameOBJ = await SQL.getGame(req.query.id, user.id);
        let game = new Game(gameOBJ);
        if(game === undefined){
          res.json({
            status: 'ok'
          })
          utils.logInteraction('gamedelete', `${user.email} tryed to delete a game which doesn't exist. id: ${req.query.id}`);
          return;
        }else{
          if(game.isOwner){
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
      let error = err.reason || err.error || "Errore interno al server"
      res.json(error);
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
