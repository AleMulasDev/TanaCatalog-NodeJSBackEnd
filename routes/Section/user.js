var express = require('express');
var router = express.Router();
var utils = require("../../utils/utils.js");
var SQL = utils.SQL;
var {GamePermissions, GamePermissionRequest} = require("./../../models/GamePermissions");
var {ToQuerySectionPermissions} = require("./../../models/SectionPermissions");

// get user list of a section
router.get('/', async function(req, res, next) {
  let requestError = utils.checkRequest(req, `query`,
    {name: `token`},
    {name: 'sectionID'}
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
      let canAccess = await SQL.canAccessSection(req.query.sectionID, user.id);
      if(canAccess){
        let users = await SQL.sectionUserList(req.query.sectionID);
        res.json({
          status: 'ok',
          users
        })
      }else{
        res.json({
          error: 'Non hai accesso a questa sezione'
        })
      }
    }catch(err){
      let error = err.error || err.reason || err;
      res.json(error);
      utils.logDebug('sectionUserGET', `Error: ${err.debug || err}`);
      return;
    }

  }else{
    res.json({error: requestError});
  }
});

// add or update user to section
router.put('/', async function(req, res, next) {
  let requestError = utils.checkRequest(req, `body`,
    {name: `token`},
    {name: 'sectionID'},
    {name: 'userEmail'},
  );
  if(!requestError){
    let user;
    try{
      user = await utils.retrieveUser(req.body.token);

    }catch(err){
      let error = err.error || err;
      res.json(error);
      utils.logDebug('sectionUserPUT', `Error user checking: ${err.debug || err}`);
      return;
    }

    let userID;
    //parse email and retrieve user id
    try{
      userID = await SQL.getUserId(req.body.userEmail);
    }catch(err){
      let error = err.reason || 'Si è verificato un errore nel server';
      res.json(error);
      utils.logDebug('sectionUserPUT', `Error retrieving user id: ${err.debug || err}`);
      return;
    }

    if(req.body.permission){
      req.body.permission = new ToQuerySectionPermissions(req.body.permission);
    }

    try{
      let canAccess = await SQL.canAccessSection(req.body.sectionID, user.id);
      if(canAccess){
        let alredyExist = await SQL.canAccessSection(req.body.sectionID, userID);
        if(alredyExist){
          let canModifyPermission = await SQL.canModifySectionPermission(req.body.sectionID, user.id);
          if(canModifyPermission){
            if(req.body.permission){
              let success = await SQL.updateUserPermission(userID, req.body.sectionID, req.body.permission);
              if(success){
                res.json({
                  status: 'ok'
                })
                utils.logInteraction('SectionUser', `${user.email} modified a user permission (ID: ${userID}) of section ${req.body.sectionID}`)
                return;
              }else{
                res.json({
                  error: 'Errore non specificato'
                })
                return;
              }
            }else{
              res.json({
                error: 'Permessi non specificati'
              })
              return;
            }
          }else{
            res.json({
              error: 'Non hai i permessi necessari per effettuare questa operazione'
            })
            return;
          }
        }
      }else{
        res.json({
          error: 'Non hai accesso alla sezione'
        })
        return;
      }
    }catch(err){
      let error = err.reason || 'Si è verificato un errore nel server';
      res.json(error);
      utils.logDebug('sectionUserPUT', `Error updating user: ${err.debug || err}`);
      return;
    }
    
    try{
      let canAddAndModify = await SQL.canAddPeopleAndModify(req.body.sectionID, user.id);
      let canOnlyAdd = await SQL.canAddPeople(req.body.sectionID, user.id);
      if(canAddAndModify && req.body.permission){
        let success = await SQL.addUserInSection(userID, req.body.sectionID, req.body.permission);
        if(success){
          res.json({
            status: 'ok'
          })
          utils.logInteraction('SectionUser', `${user.email} added a user (ID: ${userID}) to section ${req.body.sectionID}`)
        }else{
          res.json({
            error: 'Si è verificato un errore nel server'
          })
        }
      }else{
        if(canOnlyAdd){
          let success = await SQL.addUserInSectionWithoutPermission(userID, req.body.sectionID);
        if(success){
          res.json({
            status: 'ok'
          })
          utils.logInteraction('SectionUser', `${user.email} added a user (ID: ${userID}) to section ${req.body.sectionID}`)
        }else{
          res.json({
            error: 'Si è verificato un errore nel server'
          })
        }
        }else{
          res.json({
            error: 'Non hai i permessi di effettuare questa operazione'
          })
        }
      }
    }catch(err){
      let error = err.reason || err;
      res.json(error);
      utils.logDebug('sectionUserPUT', `Error adding user: ${err.debug || err}`);
      return;
    }

  }else{
    res.json({error: requestError});
  }
});

// remove user from section
router.delete('/', async function(req, res, next) {
  let requestError = utils.checkRequest(req, `query`,
    {name: `token`},
    {name: 'sectionID'},
    {name: 'userEmail'},
  );
  if(!requestError){
    let user;
    try{
      user = await utils.retrieveUser(req.query.token);

    }catch(err){
      let error = err.error || err;
      res.json(error);
      utils.logDebug('sectionUserDELETE', `Error user checking: ${err.debug || err}`);
      return;
    }

    let userID;
    //parse email and retrieve user id
    try{
      userID = await SQL.getUserId(req.query.userEmail);
    }catch(err){
      let error = err.reason || 'Si è verificato un errore nel server';
      res.json(error);
      utils.logDebug('sectionUserPUT', `Error retrieving user id: ${err.debug || err}`);
      return;
    }

    try{
      let canAccess = await SQL.canAccessSection(req.query.sectionID, user.id);
      if(canAccess){
        let userExist = await SQL.canAccessSection(req.query.sectionID, userID);
        if(userExist){
          let isOwner = await SQL.isSectionOwner(user.id, req.query.sectionID);
          if(isOwner){
            let success = await SQL.removeUserInSection(userID, req.query.sectionID);
            if(success){
              res.json({
                status: 'ok'
              })
              utils.logInteraction('SectionUser', `${user.email} removed a user (ID: ${userID}) to section ${req.query.sectionID}`)
            }else{
              res.json({
                error: 'Errore nella rimozione'
              })
              return;
            }
          }else{
            res.json({
              error: 'Solo i creatori della sezione possono rimuovere utenti'
            })
            return;
          }
        }else{
          res.json({
            error: 'User doesn\'t exist'
          })
          return;
        }
      }else{
        res.json({
          error: 'Non hai accesso alla sezione'
        })
        return;
      }
    }catch(err){
      let error = err.reason || 'Si è verificato un errore nel server';
      res.json(error);
      utils.logDebug('sectionUserDELETE', `Error removing user: ${err.debug || err}`);
      return;
    }
    
  }else{
    res.json({error: requestError});
  }
});

module.exports = router;
