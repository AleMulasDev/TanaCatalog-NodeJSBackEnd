var express = require('express');
var router = express.Router();
var utils = require("../../utils/utils.js");
const path = require('path');
const fs = require('fs');

router.get('/:image', async function(req, res, next) {
  if(req.params && req.params.image){
    if(utils.imageRegex.test(req.params.image)){
      let pathFile = path.join(__dirname, req.params.image);
      res.sendFile(pathFile);
    }else{
      //Didn't pass regexp check
      res.json({
        error: 'Immagine non valida'
      })
      utils.logDebug('getImage', `Invalid image name: ${req.params.image}`);
    }
  }else{
    // empty req params or image
    res.json({
      error: 'Specificare un immagine'
    })
    utils.logDebug('getImage', 'Empty req.params or empty req.params.image');
  }
})
  

module.exports = router;
