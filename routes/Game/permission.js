var express = require('express');
var router = express.Router();
var utils = require("../../utils/utils.js");
var SQL = utils.SQL;
var {GamePermissions, GamePermissionRequest} = require("./../../models/GamePermissions");

// game permission
router.get('/', async function(req, res, next) {
  let requestError = utils.checkRequest(req, `query`,
    {name: `token`}
  );
  if(!requestError){
    let user;
    try{
      user = await utils.retrieveUser(req.query.token);

    }catch(err){
      let error = err.error || err;
      res.json(error);
      utils.logDebug('gamePermissionGET', `Error user checking: ${err.debug || err}`);
      return;
    }

    try{
      let permissionOBJ = await SQL.getGamePermission(req.query.gameID);
      let permission = new GamePermissions(permissionOBJ);

      res.json({
        status: 'ok',
        permission
      })
    }catch(err){
      let error = err.error || err.reason || err;
      res.json(error);
      utils.logDebug('gamePermissionGET', `Error permission retrieving: ${err.debug || err}`);
      return;
    }

  }else{
    res.json({error: requestError});
  }
});

// game permission
router.put('/', async function(req, res, next) {
  let requestError = utils.checkRequest(req, `body`,
    {name: `token`},
    {name: 'gameID'},
    {name: 'ownerID'},
    {name: 'canUpdateGame'}
  );
  if(!requestError){
    let user;
    try{
      user = await utils.retrieveUser(req.body.token);

    }catch(err){
      let error = err.error || err;
      res.json(error);
      utils.logDebug('gamePermissionPUT', `Error user checking: ${err.debug || err}`);
      return;
    }

    try{
      let permissionOBJ = await SQL.getGamePermission(req.body.gameID);
      let permission = new GamePermissions(permissionOBJ);

      try{
        if(permission.ownerID == user.id){
          let permission = new GamePermissionRequest(req.body);
          let success = await SQL.setGamePermission(permission);
          if(success){
            res.json({
              status: 'ok'
            })
          }else{
            res.json({
              error: 'Si è verificato un errore con l\'aggiornamento dei permessi'
            })
          }
        }else{
          res.json({
            error: 'Solo il creatore del gioco può modificare i permessi'
          });
          utils.logDebug('gamePermissionPUT', `User tried to modify permission`);
          return;
        }
      }catch(err){
        let error = err.reason || err;
        res.json({
          error
        })
        utils.logDebug('gamePermissionPUT', `Error updating game permission: ${err.debug || err}`);
        return;
      }
      
      

    }catch(err){
      let error = err.error || err.reason || err;
      res.json(error);
      utils.logDebug('gamePermissionPUT', `Error permission updating: ${err.debug || err}`);
      return;
    }

  }else{
    res.json({error: requestError});
  }
});

module.exports = router;
