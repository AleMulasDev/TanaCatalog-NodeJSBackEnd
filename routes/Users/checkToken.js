var express = require('express');
var router = express.Router();
var utils = require("../../utils/utils.js");
var SQL = utils.SQL;

// check token
router.get('/', async function(req, res, next) {
  let requestError = utils.checkRequest(req, `query`,
    {name: `token`}
  );
  if(!requestError){
    try{
      let user = await utils.retrieveUser(req.query.token);
      res.json({
        status: 'ok',
        expirationDate: user.expirationDate
      });
    }catch(err){
      let error = err.error || err;
      res.json(error);
      utils.logDebug('checkTokenGET', `Error: ${err.debug || err}`);
    }
  }else{
    res.json({error: requestError});
  }
});

module.exports = router;
