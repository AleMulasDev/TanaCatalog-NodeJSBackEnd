var express = require(`express`);
var router = express.Router();
var utils = require("../../utils/utils.js");
var SQL = utils.SQL;
var Holder = require("../../models/Holders");

// get holder list for a specified section
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
      utils.logDebug(`holderGET`, `User operations: ` + err.debug?err.debug:err);
      return;
    }

    try{
      let canAccess = await SQL.canAccessSection(req.query.sectionID, user.id);
      if(canAccess){
        let holders = await SQL.getHolders(req.query.sectionID);
        res.send({
          status: 'ok',
          holders
        })
      }else{
        res.json({
          error: 'Non hai il permesso di effettuare questa operazione'
        })
        utils.logDebug('holderGET', 'User didn\'have permission to perform query');
      }
    }catch(err){
      let error = err.reason?err.reason:err
      res.json({
        error
      })
      utils.logDebug(`holderGET`, `Holder operations: ` + err.debug?err.debug:err);
      return;
    }
    
  }else{
    res.json({error: requestError});
  }
});

// add new holder
router.put(`/`, async function(req, res, next) {
  let requestError = utils.checkRequest(req, `body`, 
    {name: `title`, isName: true},
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
      utils.logDebug(`holderPUT`, `User operations: ${err.debug?err.debug:err}`);
      return;
    }

    try{
      let canAdd = SQL.canAddHolder(user.id, req.body.sectionID);
      if(!canAdd){
        res.json({
          error: `Non sei un utente autorizzato ad effettuare questa operazione`
        })
        utils.logDebug(`holderPUT`, `Whitelist-check operations: user ${user.email} is not whitelist`);
        return;
      }
    }catch(err){
      let error = err.reason?err.reason:err
      res.json({
        error
      })
      utils.logDebug(`holderPUT`, `Whitelist-check operations: ${err.debug?err.debug:err}`);
      return;
    }

    try{
      let checkHolder;
      if(req.body.id){
        checkHolder = await SQL.existHolder(req.body.id, req.body.sectionID)
      }
      if(checkHolder){
        // update existing holder
        let holder = new Holder(req.body);
        holder.section_id = req.body.sectionID;
        let editSuccess = await SQL.editHolder(holder);
        if(editSuccess){
          res.json({
            status: "ok"
          })
          utils.logInteraction('holder', `${user.email} modified a holder`);
        }else{
          res.json({
            error: 'Errore interno al server'
          })
          utils.logDebug('holderPUT endpoint', 'Didn\'t manage to update the holder');
        }
        return;
      }
    }catch(err){
      utils.logDebug('holderPUT endpoint', 'Checking if alredy exist error: ' + (err.debug || err));
      res.json({error: err.reason ? err.reason : "Errore interno al server"})
      return;
    }

    try{
      let holder = new Holder(req.body);
      holder.section_id = req.body.sectionID;
      let holderID = await SQL.addHolder(holder);
      res.json({
        status: `ok`,
        holderID 
      })
      utils.logInteraction(`holder`, `${user.email} created holder ${req.body.title}`);
    }catch(err){
      let error = err.reason?err.reason:err
      res.json({
        error
      })
      utils.logDebug(`holderPUT`, `Holders operations: ${err.debug?err.debug:err}`);
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
      utils.logDebug(`holderDELETE`, `User operations: ` + err.debug?err.debug:err);
      return;
    }

    try{
      let canEdit = await SQL.canAddHolder(user.id, req.query.sectionID);
      if(!canEdit){
        res.json({
          error: `Non sei un utente autorizzato ad effettuare questa operazione`
        })
        utils.logDebug(`holderDELETE`, `Owner-check operations: user ${user.email} can\'t remove holders of section ${req.query.sectionID}`);
        return;
      }
    }catch(err){
      let error = err.reason?err.reason:err
      res.json({
        error
      })
      utils.logDebug(`holderDELETE`, `Owner-check operations: ` + err.debug?err.debug:err);
      return;
    }

    try{
      let deleted = await SQL.removeHolder(req.query.id, req.query.sectionID);
      if(deleted){
        res.json({
          status: `ok`
        })
        utils.logInteraction(`holder`, `${user.email} deleted holder ${req.query.id}`);
      }else{
        res.json({
          error: 'Errore interno al server'
        })
        utils.logDebug(`holderDELETE`, 'Didn\'t manage to delete the holder');
      }
    }catch(err){
      let error = err.reason?err.reason:err
      res.json({
        error
      })
      utils.logDebug(`holderDELETE`, `Error deleting a holder: ${err.debug || err}`);
      return;
    }
  }else{
    res.json({error: requestError});
  }
})

module.exports = router;
