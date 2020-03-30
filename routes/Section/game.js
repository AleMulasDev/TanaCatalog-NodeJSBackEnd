var express = require(`express`);
var router = express.Router();
var utils = require("../../utils/utils.js");
var SQL = utils.SQL;
var {SectionGames, SectionGamesQuery} = require("./../../models/SectionGame");

// get games list for a specified section
router.get(`/`, async function(req, res, next) {
  let requestError = utils.checkRequest(req, `query`, 
    {name: `sectionID`},
    {name: `token`}
  );
  if(!requestError){
    let user;
    try{
      user = await utils.retrieveUser(req.query.token);
    }catch(err){
      let error = err.reason?err.reason:err
      res.json({
        error
      })
      utils.logDebug(`sectionGameGET`, `User operations: ` + err.debug?err.debug:err);
      return;
    }

    try{
      let canAccess = await SQL.canAccessSection(req.query.sectionID, user.id);
      if(canAccess){
        let sectionGames = await SQL.sectionGameList(req.query.sectionID);
        res.send({
          status: 'ok',
          sectionGames
        })
      }else{
        res.json({
          error: 'Non hai il permesso di effettuare questa operazione'
        })
        utils.logDebug('sectionGameGET', 'User didn\'have permission to perform query');
      }
    }catch(err){
      let error = err.reason?err.reason:err
      res.json({
        error
      })
      utils.logDebug(`sectionGameGET`, `SectionGames operations: ` + err.debug?err.debug:err);
      return;
    }
    
  }else{
    res.json({error: requestError});
  }
});

// add new holder
router.put(`/`, async function(req, res, next) {
  let requestError = utils.checkRequest(req, `body`,
    {name: `token`},
    {name: `sectionID`}
  );
  if(!requestError){

    let user;
    try{
      user = await utils.retrieveUser(req.body.token);
    }catch(err){
      let error = err.reason?err.reason:err
      res.json({
        error
      })
      utils.logDebug(`sectionGamePUT`, `User operations: ${err.debug?err.debug:err}`);
      return;
    }

    try{
      let canDo; 
      if(req.body.id){
        canDo = await SQL.canUpdateSectionGame(user.id, req.body.sectionID);
      }else{
        canDo = await SQL.canAddSectionGame(user.id, req.body.sectionID);
      }
      if(!canDo){
        res.json({
          error: `Non sei un utente autorizzato ad effettuare questa operazione`
        })
        utils.logDebug(`sectionGamePUT`, `Permission checking operations: user ${user.email} cannot add section games`);
        return;
      }
    }catch(err){
      let error = err.reason?err.reason:err
      res.json({
        error
      })
      utils.logDebug(`sectionGamePUT`, `Whitelist-check operations: ${err.debug?err.debug:err}`);
      return;
    }

    try{
      let checkSectionGame;
      if(req.body.id){
        checkSectionGame = await SQL.getSectionGame(req.body.sectionID, req.body.id)
      }
      if(checkSectionGame){
        // update existing holder
        let sectionGame = new SectionGames(req.body);
        sectionGame.section_id = req.body.sectionID;
        let editSuccess = await SQL.updateSectionGame(req.body.sectionID, req.body.id, sectionGame);
        if(editSuccess){
          res.json({
            status: "ok"
          })
          utils.logInteraction('SectionGames', `${user.email} modified a sectionGame`);
        }else{
          res.json({
            error: 'Errore interno al server'
          })
          utils.logDebug('sectionGamePUT endpoint', 'Didn\'t manage to update the section game');
        }
        return;
      }
    }catch(err){
      utils.logDebug('sectionGamePUT endpoint', 'Checking if alredy exist error: ' + (err.debug || err));
      res.json({error: err.reason ? err.reason : "Errore interno al server"})
      return;
    }

    try{
      let sectionGame = new SectionGames(req.body);
      sectionGame.section_id = req.body.sectionID;
      let sectionGameID = await SQL.addSectionGame(sectionGame);
      res.json({
        status: `ok`,
        sectionGameID 
      })
      utils.logInteraction(`sectionGames`, `${user.email} created sectionGame`);
    }catch(err){
      let error = err.reason?err.reason:err
      res.json({
        error
      })
      utils.logDebug(`sectionGamePUT`, `Section games operations: ${err.debug?err.debug:err}`);
      return;
    }

  }else{
    res.json({error: requestError});
  }
});

router.delete(`/`, async function(req, res, next) {
  let requestError = utils.checkRequest(req, `query`, 
    {name: `id`},
    {name: `token`},
    {name: `sectionID`}
  );
  if(!requestError){
    let user;
    try{
      user = await utils.retrieveUser(req.query.token);
    }catch(err){
      let error = err.reason?err.reason:err
      res.json({
        error
      })
      utils.logDebug(`sectionGameDELETE`, `User operations: ` + err.debug?err.debug:err);
      return;
    }

    try{
      let canEdit = await SQL.canDeleteSectionGame(user.id, req.query.sectionID)
      if(!canEdit){
        res.json({
          error: `Non sei un utente autorizzato ad effettuare questa operazione`
        })
        utils.logDebug(`sectionGameDELETE`, `Owner-check operations: user ${user.email} can\'t remove sectionGame of section ${req.query.sectionID}`);
        return;
      }
    }catch(err){
      let error = err.reason?err.reason:err
      res.json({
        error
      })
      utils.logDebug(`sectionGameDELETE`, `Permission checking operations: ` + err.debug?err.debug:err);
      return;
    }

    try{
      let deleted = await SQL.deleteSectionGame(req.query.sectionID, req.query.id);
      if(deleted){
        res.json({
          status: `ok`
        })
        utils.logInteraction(`sectionGame`, `${user.email} deleted sectionGame ${req.query.id}`);
      }else{
        res.json({
          error: 'Errore interno al server'
        })
        utils.logDebug(`sectionGameDELETE`, 'Didn\'t manage to delete the section game');
      }
    }catch(err){
      let error = err.reason?err.reason:err
      res.json({
        error
      })
      utils.logDebug(`sectionGameDELETE`, `Error deleting a section game: ${err.debug || err}`);
      return;
    }
  }else{
    res.json({error: requestError});
  }
})

module.exports = router;
