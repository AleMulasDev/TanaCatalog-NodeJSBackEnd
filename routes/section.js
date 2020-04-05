var express = require(`express`);
var router = express.Router();
var utils = require("../utils/utils.js");
var SQL = utils.SQL;

// get section list for a given user or a single one if specified by the id
router.get(`/`, async function(req, res, next) {
  let requestError = utils.checkRequest(req, `query`, 
    // {name: `id`},
    {name: `token`}
  );
  if(!requestError){
    let user;
    try{
      user = await utils.retrieveUser(req.query.token);
    }catch(err){
      let error = err.error?err.error:err
      res.json({
        error
      })
      utils.logDebug(`sectionGET`, `User operations: ` + err.debug?err.debug:err);
      return;
    }

    try{
      let sections = await SQL.getSection(user.id);
      res.json({
        status: `ok`,
        sections
      })
    }catch(err){
      let error = err.reason?err.reason: 'Errore interno al server'
      res.json({
        error
      })
      utils.logDebug(`sectionGET`, `Sections operations: ` + err.debug?err.debug:err);
      return;
    }
    
  }else{
    res.json({error: requestError});
  }
});

// add new section
router.put(`/`, async function(req, res, next) {
  let requestError = utils.checkRequest(req, `body`, 
    {name: `title`, isName: true},
    {name: `token`}
  );
  if(!requestError){

    let user;
    try{
      user = await utils.retrieveUser(req.body.token);
    }catch(err){
      let error = err.error?err.error:err
      res.json({
        error
      })
      utils.logDebug(`sectionPUT`, `User operations: ${err.debug?err.debug:err}`);
      return;
    }

    try{
      let isWhitelist = SQL.userIsWhitelist(user.id);
      if(!isWhitelist){
        res.json({
          error: `Non sei un utente autorizzato ad effettuare questa operazione`
        })
        utils.logDebug(`sectionPUT`, `Whitelist-check operations: user ${user.email} is not whitelist`);
        return;
      }
    }catch(err){
      let error = err.reason?err.reason: 'Errore interno al server'
      res.json({
        error
      })
      utils.logDebug(`sectionPUT`, `Whitelist-check operations: ${err.debug?err.debug:err}`);
      return;
    }

    try{
      let checkSection;
      if(req.body.id){
        checkSection = await SQL.getSection(req.body.id)
      }
      if(checkSection){
        let isOwner = SQL.isSectionOwner(user.id, req.body.id);
        if(!isOwner){
          res.json({
            error: `Non sei un utente autorizzato ad effettuare questa operazione`
          })
          utils.logDebug(`sectionDELETE`, `Owner-check operations: user ${user.email} is not the owner of section ${req.body.id}`);
          return;
        }
        // update existing section
        await SQL.modifySection(req.body.id, req.body.title);
        res.json({
          status: "ok"
        })
        utils.logInteraction('section', `${user.email} modified a section`);
        return;
      }
    }catch(err){
      utils.logDebug('sectionPUT endpoint', 'Checking if alredy exist error: ' + (err.debug || err));
      res.json({error: err.reason ? err.reason : "Errore interno al server"})
      return;
    }

    try{
      let {sectionId} = await SQL.addSection(req.body.title, user.id);
      res.json({
        status: `ok`,
        sectionId 
      })
      utils.logInteraction(`section`, `${user.email} created section ${req.body.title}`);
    }catch(err){
      let error = err.reason?err.reason: 'Errore interno al server'
      res.json({
        error
      })
      utils.logDebug(`sectionPUT`, `Sections operations: ${err.debug?err.debug:err}`);
      return;
    }

  }else{
    res.json({error: requestError});
  }
});

router.delete(`/`, async function(req, res, next) {
  let requestError = utils.checkRequest(req, `query`, 
    {name: `id`},
    {name: `token`}
  );
  if(!requestError){
    let user;
    try{
      user = await utils.retrieveUser(req.query.token);
    }catch(err){
      let error = err.error?err.error:err
      res.json({
        error
      })
      utils.logDebug(`sectionDELETE`, `User operations: ` + err.debug?err.debug:err);
      return;
    }

    try{
      let isOwner = await SQL.isSectionOwner(user.id, req.query.id);
      if(!isOwner){
        res.json({
          error: `Non sei un utente autorizzato ad effettuare questa operazione`
        })
        utils.logDebug(`sectionDELETE`, `Owner-check operations: user ${user.email} is not the owner of section ${req.query.id}`);
        return;
      }
    }catch(err){
      let error = err.reason?err.reason: 'Errore interno al server'
      res.json({
        error
      })
      utils.logDebug(`sectionDELETE`, `Owner-check operations: ` + err.debug?err.debug:err);
      return;
    }

    try{
      await SQL.deleteSection(req.query.id);
      res.json({
        status: `ok`
      })
      utils.logInteraction(`section`, `${user.email} deleted section ${req.query.id}`);
    }catch(err){
      let error = err.reason?err.reason: 'Errore interno al server'
      res.json({
        error
      })
      utils.logDebug(`sectionDELETE`, `Sections operations: ` + err.debug?err.debug:err);
      return;
    }
  }else{
    res.json({error: requestError});
  }
})

module.exports = router;
