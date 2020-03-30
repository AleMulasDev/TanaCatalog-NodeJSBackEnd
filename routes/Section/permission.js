var express = require('express');
var router = express.Router();
var utils = require("../../utils/utils.js");
var SQL = utils.SQL;
var {SectionPermissions} = require("./../../models/SectionPermissions");

// section permission
router.get('/', async function(req, res, next) {
  let requestError = utils.checkRequest(req, `query`,
    {name: `token`},
    {name: `sectionID`}
  );
  if(!requestError){
    let user;
    try{
      user = await utils.retrieveUser(req.query.token);

    }catch(err){
      let error = err.error || err;
      res.json(error);
      utils.logDebug('sectionPermissionGET', `Error user checking: ${err.debug || err}`);
      return;
    }

    try{
      let permissionOBJ = await SQL.getSectionPermission(user.id, req.query.sectionID);
      let permission = new SectionPermissions(permissionOBJ);

      res.json({
        status: 'ok',
        permission
      })
    }catch(err){
      let error = err.error || err.reason || err;
      res.json(error);
      utils.logDebug('sectionPermissionGET', `Error permission retrieving: ${err.debug || err}`);
      return;
    }

  }else{
    res.json({error: requestError});
  }
});

module.exports = router;
