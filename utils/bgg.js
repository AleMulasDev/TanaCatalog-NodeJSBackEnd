let utils = require('./utils.js');
let constants = utils.constants;
const {http} = require('follow-redirects');
const parseString = require('xml2js').parseString;

async function search(name) {
  return new Promise( (resolve, reject) => {
    let query = utils.encodeQueryData({'search': name});
    http.get(constants.bgg.BGG_SEARCH_PATH+'?'+query, (res) => {
      const { statusCode } = res;
      const contentType = res.headers['content-type'];
      if (statusCode !== 200 && statusCode !==307) {
        reject({
          reason: 'Errore col collegamento alla API di BoardGameGeek',
          debug: `[BGGSEARCH] Invalid status code: ${statusCode}`
        })
      }
      
      res.setEncoding('utf8');
      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        try {
          parseString(rawData, function (err, result) {
            if(!err){
              try{
                resolve(result.boardgames.boardgame);
              }catch(err){
                reject({
                  reason: 'Errore col collegamento alla API di BoardGameGeek',
                  debug: `[BGGSEARCH] XML to json parsing error: ${err}`
                })
              }
            }else{
              reject({
                reason: 'Errore col collegamento alla API di BoardGameGeek',
                debug: `[BGGSEARCH] XML parsing error: ${err}\nXML:\n${rawData}`
              })
            }
          });
        } catch (err) {
          reject({
            reason: 'Errore col collegamento alla API di BoardGameGeek',
            debug: `[BGGSEARCH] End-parsing error: ${err}`
          })
        }
      });
    }).on('error', (err) => {
      reject({
        reason: 'Errore col collegamento alla API di BoardGameGeek',
        debug: `[BGGSEARCH] Error ending connection: ${err}`
      })
    });
  })
}

async function fetch(...id) {
  return new Promise( (resolve, reject) => {
    http.get(constants.bgg.BGG_FETCHGAME_PATH+id.join(','), (res) => {
      const { statusCode } = res;
      const contentType = res.headers['content-type'];
      if (statusCode !== 200 && statusCode !==307) {
        reject({
          reason: 'Errore col collegamento alla API di BoardGameGeek',
          debug: `[BGGFETCH] Invalid status code: ${statusCode}`
        })
      }
      
      res.setEncoding('utf8');
      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        try {
          parseString(rawData, function (err, result) {
            if(!err){
              try{
                resolve(result.boardgames.boardgame);
              }catch(err){
                reject({
                  reason: 'Errore col collegamento alla API di BoardGameGeek',
                  debug: `[BGGFETCH] XML to json parsing error: ${err}`
                })
              }
            }else{
              reject({
                reason: 'Errore col collegamento alla API di BoardGameGeek',
                debug: `[BGGFETCH] XML parsing error: ${err}\nXML:\n${rawData}`
              })
            }
          });
        } catch (err) {
          reject({
            reason: 'Errore col collegamento alla API di BoardGameGeek',
            debug: `[BGGFETCH] End-parsing error: ${err}`
          })
        }
      });
    }).on('error', (err) => {
      reject({
        reason: 'Errore col collegamento alla API di BoardGameGeek',
        debug: `[BGGFETCH] Error ending connection: ${err}`
      })
    });
  })
}


let bgg = {
  search,
  fetch
}


module.exports = bgg;