var mysql = require("mysql");
const constant = require("./constant");
const secrets = require("./_secrets");
let {GameQuery, Game} = require("../models/Game");
let Holder = require("./../models/Holders");
let {SectionGamesQuery} = require("./../models/SectionGame");
let {SectionPermissionsQuery} = require("./../models/SectionPermissions");
let {GamePermissionsQuery} = require("./../models/GamePermissions");
let {SectionUserQuery, ToQuerySectionPermissions} = require("./../models/SectionUser");

var pool  = mysql.createPool({
  connectionLimit : 10,
  host: constant.MYSQL_ADDRESS,
  user: secrets.MYSQL_USERNAME,
  password: secrets.MYSQL_PASSWORD,
  database: "tanagoblin"
});

function _initConnection() {
  // return mysql.createConnection({
  //   host: constant.MYSQL_ADDRESS,
  //   user: secrets.MYSQL_USERNAME,
  //   password: secrets.MYSQL_PASSWORD,
  //   database: "tanagoblin"
  // });
  return pool;
}

//---------------------------------------------------------
//                          USERS
//---------------------------------------------------------

async function _login(email) {
  let connection = _initConnection();
  return new Promise((resolve, reject) => {

    connection.query(
      `SELECT id,email, password, firstname, lastname FROM users WHERE email=? and verified=true`,
      [email],
      (error, results, fields) => {
        if (error) {
          //Mysql error
          reject({
            reason: "Errore interno al server, riprova più tardi",
            debug: `[MYSQL] Error in the login: ${error}`
          })
        } else {
          if (results.length != 1) {
            reject({
              reason: "Email o password errati. Assicurati anche di aver verificato la mail prima di loggare",
              debug: "[MYSQL] Not exactly one result: obtained " + results.length
            });
          } else {
            resolve({
              id: results[0]["id"],
              email: results[0]["email"],
              password: results[0]["password"]
            });
          }
        }
      }
    );
  });
}

async function _updateEmail(oldEmail, newEmail){
  let connection = _initConnection();
  //connection.connect();
  return new Promise((resolve, reject) => {
    connection.query(`\
    UPDATE users SET email = ?, verified = false WHERE email = ?`,
    [newEmail, oldEmail],
    (error, results, fields) => {
      if(!error){
        resolve();
      }else{
        reject({
          reason: "Errore interno al server, riprova più tardi",
          debug: `[MYSQL] Error in the updateEmail: ${error}`
        })
      }
    })
  })
}

async function _register(email, password, firstname, lastname){
  let connection = _initConnection();
  //connection.connect();
  return new Promise((resolve, reject) => {
    connection.query(
    `INSERT INTO users (email, password, firstname, lastname) \
    VALUES (?, ?, ?, ?)`,
    [email, password, firstname, lastname],
    (error, results, fields) => {
      if(!error){
        resolve(results.insertId);
      }else{
        //error executing query
        reject({
          reason: "Errore interno al server, riprova più tardi",
          debug: `[MYSQL] Error in the register: ${error}`
        })
      }
    });//end of query
  });//end of promise
}

async function _mailExist(email){
  return new Promise((resolve, reject) => {
    let connection = _initConnection();

    connection.query(
    `SELECT id FROM users WHERE email=?`,
    [email],
    (error, results, fields) => {
      if(!error){
        if(results.length == 0){
          resolve(false);
        }else{
          resolve(true);
        }
      }else{
        //error executing query
        reject({
          reason: "Errore interno al server, riprova più tardi",
          debug: `[MYSQL] Error in the mailExist: ${error}`
        })
      }
    });//end of query
  });
}

async function _getUserId(email){
  return new Promise((resolve, reject) => {
    let connection = _initConnection();

    connection.query(
    `SELECT id FROM users WHERE email=?`,
    [email],
    (error, results, fields) => {
      if(!error){
        try{
          resolve(results[0]['id']);
        }catch(err){
          reject({
            reason: "L'utente richiesto non esiste",
            debug: `[MYSQL] User (${email}) doesn't exist`
          })
        }
      }else{
        //error executing query
        reject({
          reason: "Errore interno al server, riprova più tardi",
          debug: `[MYSQL] Error in the getUserId: ${error}`
        })
      }
    });//end of query
  });//end of promise
}

function _verify(userID){
  let connection = _initConnection();
  //connection.connect();
  return new Promise((resolve, reject) => {
    connection.query(`\
    UPDATE users SET verified = true WHERE id = ?`,
    [userID],
    (error, results, fields) => {
      if(!error){
        if(results.affectedRows === 1){
          resolve(results.insertId);
        }else{
          reject({
            // It MUST be alredy verified since the id comes from an encrypted token and
            // therefore it's trusted
            reason: "Mail già verificata",
            debug: "[MYSQL] More or less than 1 row affected " + results.affectedRows
          })
        }
      }else{
        reject({
          reason: "Errore interno al server, riprova più tardi",
          debug: `[MYSQL] Error in the verify: ${error}`
        })
      }
    })
  })
}

function _mailExistAndVerified(email){
  let connection = _initConnection();
  //connection.connect();
  return new Promise((resolve, reject) => {
    connection.query(`\
    SELECT id, email FROM users WHERE email=? AND verified=true`,
    [email],
    (error, results, fields) => {
      if(!error){
        if(results[0]['email'] == email){
          resolve(results[0]['id']);
        }else{
          reject({
            reason: "Email inesistente o non verificata",
            debug: `[MYSQL] Received invalid email: Received: ${email}\nSQL: ${results[0]['email']}`
          })
        }
      }else{
        reject({
          reason: "Errore interno al server, riprova più tardi",
          debug: `[MYSQL] Error in the mailExistAndVerified: ${error}`
        })
      }
    })
  })
}

function _updatePassword(id, password){
  let connection = _initConnection();
  //connection.connect();
  return new Promise((resolve, reject) => {
    connection.query(`\
    UPDATE users SET password=? WHERE id=?`,
    [password, id],
    (error, results, fields) => {
      if(!error){
        connection.query(`\
        SELECT email FROM users WHERE id=?`,
        [id],
        (error2, results2, fields2) =>{
          if(!error2 && results2[0]['email']){
            resolve(results2[0]['email']);
          }else{
            reject({
              reason: "Errore interno al server, riprova più tardi",
              debug: `[MYSQL] Error in the second query of updatePassword:\n${error2}\nresult: ${results2[0]['email']}`
            })
          }
        });//end second query
      }else{
        reject({
          reason: "Errore interno al server, riprova più tardi",
          debug: `[MYSQL] Error in the first query of updatePassword:\n${error}`
        })
      }
    })
  })
}

async function _userIsWhitelist(id){
  return new Promise((resolve, reject) => {
    let connection = _initConnection();

    connection.query(
    `SELECT id FROM users WHERE is_whitelist=TRUE`,
    (error, results, fields) => {
      if(!error){
        if(results.length == 0){
          resolve(false);
        }else{
          resolve(true);
        }
      }else{
        //error executing query
        reject({
          reason: "Errore interno al server, riprova più tardi",
          debug: "[MYSQL] Error executing userIsWhitelist " + error
        });
      }
    })
  })
}

//---------------------------------------------------------
//                          GAME
//---------------------------------------------------------

async function _gameList(){
  return new Promise((resolve, reject) => {
    let connection = _initConnection();

    connection.query(
    `SELECT games.id, owner_id, title, description, link_tdg, players, playtime, age, gamebgg_id, image, thumbnail, price, firstname, lastname, can_update_game
    FROM games, users, gamePermissions
    WHERE games.id = game_id
    AND users.id = owner_id`,
    (error, results, fields) => {
      if(!error){
        let games = new Array();
        for(result of results){
          games.push(new GameQuery(result));
        }
        resolve(games);
      }else{
        //error executing query
        reject({
          reason: "Errore interno al server, riprova più tardi",
          debug: "[MYSQL] Error executing gamelist query " + error
        });
      }
    });//end of query
  });//end of promise
}

async function gameListWithPermission(userID){
  return new Promise((resolve, reject) => {
    let connection = _initConnection();
    connection.query(
    `SELECT games.id, owner_id, title, description, link_tdg, players, playtime, age, gamebgg_id, image, thumbnail, price, firstname, lastname, can_update_game,
    COALESCE((
      SELECT 'true'
      FROM gamePermissions
      WHERE (owner_id = ?
      OR can_update_game = TRUE)
      AND game_id = games.id
    ), 'false') as canEdit,
    COALESCE((
      SELECT 'true'
      FROM gamePermissions
      WHERE owner_id = ?
      AND game_id = games.id
    ), 'false') as isOwner
    FROM games, users, gamePermissions
    WHERE games.id = game_id
    AND users.id = owner_id;`,
    [userID, userID],
    (error, results, fields) => {
      if(!error){
        let games = new Array();
        for(result of results){
          games.push(new GameQuery(result));
        }
        resolve(games);
      }else{
        //error executing query
        reject({
          reason: "Errore interno al server, riprova più tardi",
          debug: "[MYSQL] Error executing gamelist query " + error
        });
      }
    });//end of query
  });//end of promise
}

async function _addGame(game){
  return new Promise((resolve, reject) => {
    let connection = _initConnection();

    connection.query(
    `INSERT INTO games (title, description, link_tdg, players, playtime, age, gamebgg_id, image, thumbnail, price) VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [game.title, game.description, game.link_tdg, game.players, game.playtime, game.age, game.gamebgg_id, game.image, game.thumbnail, game.price],
    (error, results, fields) => {
      if(!error){
        if(results.affectedRows === 1){
          resolve(results.insertId);
        }else{
          reject({
            reason: "Errore interno al server, riprova più tardi",
            debug: "[MYSQL] More or less than 1 row affected " + results.affectedRows
          })
        }
      }else{
        //error executing query
        reject({
          reason: "Errore interno al server, riprova più tardi",
          debug: "[MYSQL] Error executing insert game query " + error
        });
      }
    });//end of query
  });//end of promise
}

async function _gameIsUsed(id){
  return new Promise((resolve, reject) => {
    let connection = _initConnection();

    connection.query(
    `SELECT game_id FROM sectionGames WHERE game_id=?`,
    [id],
    (error, results, fields) => {
      if(!error){
        if(results.length == 0){
          resolve(false);
        }else{
          resolve(true);
        }
      }else{
        //error executing query
        reject({
          reason: "Errore interno al server, riprova più tardi",
          debug: "[MYSQL] Error executing gameIsUsed " + error
        });
      }
    })
  })
}

async function _getGame(id){
  return new Promise((resolve, reject) => {
    let connection = _initConnection();

    connection.query(
    `SELECT games.id, owner_id, title, description, link_tdg, players, playtime, age, gamebgg_id, image, thumbnail, price, firstname, lastname, can_update_game
    FROM games, users, gamePermissions
    WHERE games.id = game_id
    AND users.id = owner_id
    AND games.id = ?`,
    [id],
    (error, results, fields) => {
      if(!error){
        if(results.length != 0){
          let game = new GameQuery(results);
          resolve(game)
        }else{
          resolve(undefined);
        }
      }else{
        //error executing query
        reject({
          reason: "Errore interno al server, riprova più tardi",
          debug: "[MYSQL] Error executing getGame " + error
        });
      }
    })
  })
}

async function _deleteGame(id){
  return new Promise((resolve, reject) => {
    let connection = _initConnection();

    connection.query(
    `DELETE FROM games WHERE id=?`,
    [id],
    (error, results, fields) => {
      if(!error){
        if(results.affectedRows === 1){
          resolve();
        }else{
          reject({
            reason: "Errore interno al server, riprova più tardi",
            debug: "[MYSQL] Game is not present. Affected rows: " + results.affectedRows
          })
        }
      }else{
        //error executing query
        reject({
          reason: "Errore interno al server, riprova più tardi",
          debug: "[MYSQL] Error executing getGame " + error
        });
      }
    })
  })
}

async function _updateGame(id, game){
  return new Promise((resolve, reject) => {
    let connection = _initConnection();

    connection.query(
    `UPDATE games SET title=?, description=?, link_tdg=?, players=?, playtime=?, age=?, gamebgg_id=?, image=?, thumbnail=?, price=? WHERE id=?`,
    [game.title, game.description, game.link_tdg, game.players, game.playtime, game.age, game.gamebgg_id, game.image, game.thumbnail, game.price, id],
    (error, results, fields) => {
      if(!error){
        if(results.affectedRows === 1){
          resolve();
        }else{
          reject({
            reason: "Errore interno al server, riprova più tardi",
            debug: "[MYSQL] Game is not present. Affected rows: " + results.affectedRows
          })
        }
      }else{
        //error executing query
        reject({
          reason: "Errore interno al server, riprova più tardi",
          debug: "[MYSQL] Error executing updateGame " + error
        });
      }
    })
  })
}

//---------------------------------------------------------
//                          SECTION
//---------------------------------------------------------
async function _addSection(title, ownerId){
  return new Promise((resolve, reject) => {
    let connection = _initConnection();
    connection.query(
    `INSERT INTO sections (title) VALUES (?)`,
    [title],
    (error, results, fields) => {
      if(!error){
        if(results.insertId){

          let sectionId = results.insertId;
          connection.query(
            `INSERT INTO permissions (user_id,section_id,
            can_add_game,can_delete_game,can_update_game,can_add_people,can_modify_permissions,is_owner) VALUES (?,?,true,true,true,true,true,true)`,
            [ownerId,sectionId],
            (error, results, fields) => {
              if(!error){
                resolve({
                  sectionId,
                  ownerId
                })
              }else{
                //error executing query
                reject({
                  reason: "Errore interno al server, riprova più tardi",
                  debug: "[MYSQL] Error executing addSection " + error
                });
              }
            })


        }else{
          reject({
            reason: "Errore interno al server, riprova più tardi",
            debug: "[MYSQL] Couldn't retrieve the id: " + results.insertId
          })
        }
      }else{
        //error executing query
        reject({
          reason: "Errore interno al server, riprova più tardi",
          debug: "[MYSQL] Error executing addSection " + error
        });
      }
    })
  })
}

async function _modifySection(sectionId, title){
  return new Promise((resolve, reject) => {
    let connection = _initConnection();
    connection.query(
    `UPDATE sections SET title=? WHERE id=?`,
    [title, sectionId],
    (error, results, fields) => {
      if(!error){
        resolve();
      }else{
        //error executing query
        reject({
          reason: "Errore interno al server, riprova più tardi",
          debug: "[MYSQL] Error executing modifySection " + error
        });
      }
    })
  })
}

async function _deleteSection(sectionId){
  return new Promise((resolve, reject) => {
    let connection = _initConnection();
    connection.query(
    `DELETE FROM sections WHERE id=?`,
    [sectionId],
    (error, results, fields) => {
      if(!error){
        if(results.affectedRows == 1){
          resolve(true);
        }else{
          resolve(false);
        }
      }else{
        //error executing query
        reject({
          reason: "Errore interno al server, riprova più tardi",
          debug: "[MYSQL] Error executing deleteSection " + error
        });
      }
    })
  })
}

async function _getSection(userID){
  return new Promise((resolve, reject) => {
    let connection = _initConnection();
    connection.query(
    `SELECT id, title, is_owner FROM sections, permissions
    WHERE id=section_id AND user_id=?`,
    [userID],
    (error, results, fields) => {
      if(!error){
        let sections = new Array();
        for(let result of results){
          sections.push({
            title: result.title,
            id: result.id,
            isOwner: result.is_owner
          });
        }
        resolve(sections);
      }else{
        //error executing query
        reject({
          reason: "Errore interno al server, riprova più tardi",
          debug: "[MYSQL] Error executing getSection " + error
        });
      }
    })
  })
}

async function _isSectionOwner(userID, sectionID){
  return new Promise((resolve, reject) => {
    let connection = _initConnection();

    connection.query(
    `SELECT * FROM permissions WHERE is_owner=TRUE AND section_id=? AND user_id=?`,
    [sectionID, userID],
    (error, results, fields) => {
      if(!error){
        if(results.length == 0){
          resolve(false);
        }else{
          resolve(true);
        }
      }else{
        //error executing query
        reject({
          reason: "Errore interno al server, riprova più tardi",
          debug: "[MYSQL] Error executing isSectionOwner " + error
        });
      }
    })
  })
}

async function _sectionExist(sectionID){
  return new Promise((resolve, reject) => {
    let connection = _initConnection();

    connection.query(
    `SELECT * FROM sections WHERE id=?`,
    [sectionID],
    (error, results, fields) => {
      if(!error){
        if(results.length == 0){
          resolve(false);
        }else{
          resolve(true);
        }
      }else{
        //error executing query
        reject({
          reason: "Errore interno al server, riprova più tardi",
          debug: "[MYSQL] Error executing sectionExist " + error
        });
      }
    })
  })
}

async function canAccessSection(sectionID, userID){
  return new Promise((resolve, reject) => {
    let connection = _initConnection();
    connection.query(
    `SELECT user_id FROM permissions WHERE user_id=? AND section_id=?`,
    [userID, sectionID],
    (error, results, fields) => {
      if(!error){
        if(results.length == 0){
          resolve(false);
        }else{
          resolve(true);
        }
      }else{
        //error executing query
        reject({
          reason: "Errore interno al server, riprova più tardi",
          debug: "[MYSQL] Error executing canAccessSection " + error
        });
      }
    })
  })
}

async function canModifySectionPermission(sectionID, userID){
  return new Promise((resolve, reject) => {
    let connection = _initConnection();
    connection.query(
    `SELECT user_id FROM permissions WHERE user_id=? AND section_id=? AND can_modify_permissions = TRUE OR is_owner = TRUE`,
    [userID, sectionID],
    (error, results, fields) => {
      if(!error){
        if(results.length == 0){
          resolve(false);
        }else{
          resolve(true);
        }
      }else{
        //error executing query
        reject({
          reason: "Errore interno al server, riprova più tardi",
          debug: "[MYSQL] Error executing canModifySectionPermission " + error
        });
      }
    })
  })
}

async function canAddPeopleAndModify(sectionID, userID){
  return new Promise((resolve, reject) => {
    let connection = _initConnection();
    connection.query(
    `SELECT user_id FROM permissions WHERE user_id=? AND section_id=? AND can_add_people = TRUE and can_modify_permissions = TRUE OR is_owner = TRUE`,
    [userID, sectionID],
    (error, results, fields) => {
      if(!error){
        if(results.length == 0){
          resolve(false);
        }else{
          resolve(true);
        }
      }else{
        //error executing query
        reject({
          reason: "Errore interno al server, riprova più tardi",
          debug: "[MYSQL] Error executing canAddPeopleAndModify " + error
        });
      }
    })
  })
}

async function canAddPeople(sectionID, userID){
  return new Promise((resolve, reject) => {
    let connection = _initConnection();
    connection.query(
    `SELECT user_id FROM permissions WHERE user_id=? AND section_id=? AND can_add_people = TRUE OR is_owner = TRUE`,
    [userID, sectionID],
    (error, results, fields) => {
      if(!error){
        if(results.length == 0){
          resolve(false);
        }else{
          resolve(true);
        }
      }else{
        //error executing query
        reject({
          reason: "Errore interno al server, riprova più tardi",
          debug: "[MYSQL] Error executing canAddPeople " + error
        });
      }
    })
  })
}

async function addUserInSection(userID, sectionID, permission){
  return new Promise((resolve, reject) => {
    let connection = _initConnection();
    let {can_add_game, can_delete_game, 
      can_update_game, can_add_people, can_modify_permissions} = permission;
    connection.query(
    `INSERT INTO permissions
    (user_id, section_id, can_add_game, can_delete_game, can_update_game, can_add_people, can_modify_permissions, is_owner)
    VALUES
    (?,?,?,?,?,?,?, false)`,
    [userID, sectionID, can_add_game, can_delete_game, 
      can_update_game, can_add_people, can_modify_permissions],
    (error, results, fields) => {
      if(!error){
        resolve(true);
      }else{
        //error executing query
        reject({
          reason: "Errore interno al server, riprova più tardi",
          debug: "[MYSQL] Error executing addUserInSection " + error
        });
      }
    })
  })
}

async function removeUserInSection(userID, sectionID){
  return new Promise((resolve, reject) => {
    let connection = _initConnection();
    connection.query(
    `DELETE FROM permissions
    WHERE user_id=? AND section_id=?`,
    [userID, sectionID],
    (error, results, fields) => {
      if(!error){
        if(results.affectedRows == 1){
          resolve(true);
        }else{
          resolve(false);
        }
      }else{
        //error executing query
        reject({
          reason: "Errore interno al server, riprova più tardi",
          debug: "[MYSQL] Error executing removeUserInSection " + error
        });
      }
    })
  })
}

async function updateUserPermission(userID, sectionID, permission){
  return new Promise((resolve, reject) => {
    let connection = _initConnection();
    let {can_add_game, can_delete_game, 
      can_update_game, can_add_people, can_modify_permissions} = permission;
    connection.query(
    `UPDATE permissions SET
    can_add_game=?, can_delete_game=?, can_update_game=?, can_add_people=?, can_modify_permissions=?
    WHERE user_id = ? AND section_id = ?`,
    [can_add_game, can_delete_game,
      can_update_game, can_add_people, can_modify_permissions, userID, sectionID],
    (error, results, fields) => {
      if(!error){
        if(results.affectedRows == 1){
          resolve(true);
        }else{
          resolve(false);
        }
      }else{
        //error executing query
        reject({
          reason: "Errore interno al server, riprova più tardi",
          debug: "[MYSQL] Error executing updateUserPermission " + error
        });
      }
    })
  })
}

async function addUserInSectionWithoutPermission(userID, sectionID){
  return new Promise((resolve, reject) => {
    let connection = _initConnection();
    connection.query(
    `INSERT INTO permissions
    (user_id, section_id, can_add_game, can_delete_game, can_update_game, can_add_people, can_modify_permissions, is_owner)
    VALUES
    (?,?, false, false, false, false, false, false)`,
    [userID, sectionID],
    (error, results, fields) => {
      if(!error){
        resolve(true);
      }else{
        //error executing query
        reject({
          reason: "Errore interno al server, riprova più tardi",
          debug: "[MYSQL] Error executing addUserInSectionWithoutPermission " + error
        });
      }
    })
  })
}

async function sectionUserList(sectionID){
  return new Promise((resolve, reject) => {
    let connection = _initConnection();
    connection.query(
    `SELECT 
    users.id as user_id, firstname, lastname, email, can_add_game, can_delete_game, 
    can_update_game, can_add_people, can_modify_permissions, is_owner
    FROM permissions, users 
    WHERE section_id=?
    AND users.id = user_id`,
    [sectionID],
    (error, results, fields) => {
      if(!error){
        let users = new Array();
        for(let result of results){
          users.push(new SectionUserQuery(result));
        }
        resolve(users);
      }else{
        //error executing query
        reject({
          reason: "Errore interno al server, riprova più tardi",
          debug: "[MYSQL] Error executing sectionUserList " + error
        });
      }
    })
  })
}

//---------------------------------------------------------
//                          HOLDERS
//---------------------------------------------------------
async function getHolders(sectionID){
  return new Promise((resolve, reject) => {
    let connection = _initConnection();
    connection.query(
    `SELECT id, section_id, title, address, cap, city FROM holders WHERE section_id=?`,
    [sectionID],
    (error, results, fields) => {
      if(!error){
        if(results.length != 0){
          try{
            let holders = new Array();
            for(let holder of results){
              holders.push(new Holder(holder));
            }
            resolve(holders);
          }catch(err){
            reject({
              reason: "Errore interno al server, riprova più tardi",
              debug: `[MYSQL] getHolders - catch error: ${err}`
            });
          }
        }else{
          //length is 0
          resolve();
        }
      }else{
        //error executing query
        reject({
          reason: "Errore interno al server, riprova più tardi",
          debug: `[MYSQL] Error executing getHolders: ${error}`
        });
      }
    })
  })
}

async function addHolder(holder){
  return new Promise((resolve, reject) => {
    let connection = _initConnection();
    let {section_id, title, address, cap, city} = holder;
    connection.query(
    `INSERT INTO holders (section_id, title, address, cap, city) VALUES (?,?,?,?,?)`,
    [section_id, title, address, cap, city],
    (error, results, fields) => {
      if(!error){
        if(results.insertId != 0){
          resolve(results.insertId);
        }else{
          //didn't inserted it
          reject({
            reason: "Errore interno al server, riprova più tardi",
            debug: `[MYSQL] addHolder - insertid is 0: ${results.insertId}`
          });
        }
      }else{
        //error executing query
        reject({
          reason: "Errore interno al server, riprova più tardi",
          debug: `[MYSQL] Error executing addHolder: ${error}`
        });
      }
    })
  })
}
async function removeHolder(holderID, sectionID){
  return new Promise((resolve, reject) => {
    let connection = _initConnection();
    connection.query(
    `DELETE FROM holders WHERE id=? AND section_id=?`,
    [holderID, sectionID],
    (error, results, fields) => {
      if(!error){
        if(results.affectedRows != 0){
          resolve(true);
        }else{
          reject({
            reason: "Errore interno al server, riprova più tardi",
            debug: `[MYSQL] removeHolder - alredy deleted or not exist`
          });
        }
      }else{
        //error executing query
        reject({
          reason: "Errore interno al server, riprova più tardi",
          debug: `[MYSQL] Error executing removeHolder: ${error}`
        });
      }
    })
  })
}
async function editHolder(holder){
  return new Promise((resolve, reject) => {
    let connection = _initConnection();
    let {section_id, title, address, cap, city} = holder;
    connection.query(
    `UPDATE holders SET title=?, address=?, cap=?, city=?`,
    [title, address, cap, city],
    (error, results, fields) => {
      if(!error){
        resolve(true);
      }else{
        //error executing query
        reject({
          reason: "Errore interno al server, riprova più tardi",
          debug: `[MYSQL] Error executing editHolder: ${error}`
        });
      }
    })
  })
}
async function existHolder(holderID, sectionID){
  return new Promise((resolve, reject) => {
    let connection = _initConnection();
    connection.query(
    `SELECT id FROM holders WHERE id=? AND section_id=?`,
    [holderID, sectionID],
    (error, results, fields) => {
      if(!error){
        if(results.length == 0){
          resolve(false);
        }else{
          resolve(true);
        }
      }else{
        //error executing query
        reject({
          reason: "Errore interno al server, riprova più tardi",
          debug: `[MYSQL] Error executing existHolder: ${error}`
        });
      }
    })
  })
}

async function canAddHolder(userID, sectionID){
  return new Promise((resolve, reject) => {
    let connection = _initConnection();
    connection.query(
    `SELECT u.id 
    FROM users as u, permissions as p
    WHERE u.id = p.user_id
    AND u.id=? AND p.section_id=?
    AND p.can_update_game=TRUE OR p.is_owner = TRUE`,
    [userID, sectionID],
    (error, results, fields) => {
      if(!error){
        if(results.length == 0){
          resolve(false);
        }else{
          resolve(true);
        }
      }else{
        //error executing query
        reject({
          reason: "Errore interno al server, riprova più tardi",
          debug: `[MYSQL] Error executing canAddHolder: ${error}`
        });
      }
    })
  })
}

//
//                      SECTION GAMES
//
async function sectionGameList(sectionID){
  return new Promise((resolve, reject) => {
    let connection = _initConnection();
    connection.query(
    `SELECT s.id, s.game_id, s.section_id, s.is_new, s.acquisition_date, s.origin, s.propriety, s.holder_id,
    h.title as holder_title, g.title as game_title
    FROM sectionGames as s, holders as h, games as g
    WHERE s.game_id = g.id
    AND s.holder_id = h.id
    AND s.section_id = ?`,
    [sectionID],
    (error, results, fields) => {
      if(!error){
        let games = new Array();
        for(result of results){
          games.push(new SectionGamesQuery(result));
        }
        resolve(games);
      }else{
        //error executing query
        reject({
          reason: "Errore interno al server, riprova più tardi",
          debug: "[MYSQL] Error executing sectionGameList query " + error
        });
      }
    });//end of query
  });//end of promise
}

async function addSectionGame(game){
  return new Promise((resolve, reject) => {
    let connection = _initConnection();
    let {gameID, sectionID, isNew, acquisitionDate, origin, propriety, holderID} = game
    connection.query(
    `INSERT INTO sectionGames (game_id, section_id, is_new, acquisition_date, origin, propriety, holder_id) VALUES (?,?,?,?,?,?,?)`,
    [gameID, sectionID, isNew, acquisitionDate, origin, propriety, holderID],
    (error, results, fields) => {
      if(!error){
        resolve(results.insertId);
      }else{
        //error executing query
        reject({
          reason: "Errore interno al server, riprova più tardi",
          debug: "[MYSQL] Error executing addSectionGame " + error
        });
      }
    });//end of query
  });//end of promise
}


async function getSectionGame(sectionID, gameID){
  return new Promise((resolve, reject) => {
    let connection = _initConnection();
    connection.query(
    `SELECT s.id, s.game_id, s.section_id, s.is_new, s.acquisition_date, s.origin, s.propriety, s.holder_id,
    h.title as holder_title, g.title as game_title
    FROM sectionGames as s, holders as h, games as g
    WHERE s.game_id = g.id
    AND s.holder_id = h.id
    AND s.section_id = ?
    AND s.id=?`,
    [sectionID, gameID],
    (error, results, fields) => {
      if(!error){
        if(results.length == 1){
          let game = new SectionGamesQuery(results);
          resolve(game)
        }else{
          resolve(undefined);
        }
      }else{
        //error executing query
        reject({
          reason: "Errore interno al server, riprova più tardi",
          debug: "[MYSQL] Error executing getSectionGame " + error
        });
      }
    })
  })
}

async function deleteSectionGame(sectionID, gameID){
  return new Promise((resolve, reject) => {
    let connection = _initConnection();
    connection.query(
    `DELETE FROM sectionGames WHERE id=? AND section_id=?`,
    [gameID, sectionID],
    (error, results, fields) => {
      if(!error){
        if(results.affectedRows === 1){
          resolve(true);
        }else{
          resolve(false);
        }
      }else{
        //error executing query
        reject({
          reason: "Errore interno al server, riprova più tardi",
          debug: "[MYSQL] Error executing deleteSectionGame " + error
        });
      }
    })
  })
}

async function updateSectionGame(sectionID, gameID, game){
  return new Promise((resolve, reject) => {
    let connection = _initConnection();
    let {isNew, acquisitionDate, origin, propriety, holderID} = game
    connection.query(
    `UPDATE sectionGames SET 
    is_new = ?,
    acquisition_date = ?,
    origin = ?,
    propriety = ?,
    holder_id = ?
    WHERE id=?
    AND section_id = ?`,
    [isNew, acquisitionDate, origin, propriety, holderID, gameID, sectionID],
    (error, results, fields) => {
      if(!error){
        if(results.affectedRows === 1){
          resolve(true);
        }else{
          resolve(false);
        }
      }else{
        //error executing query
        reject({
          reason: "Errore interno al server, riprova più tardi",
          debug: "[MYSQL] Error executing updateSectionGame " + error
        });
      }
    })
  })
}

//
//                      SECTION GAMES PERMISSIONS
//
async function canAddSectionGame(userID, sectionID){
  return new Promise((resolve, reject) => {
    let connection = _initConnection();
    connection.query(
    `SELECT u.id 
    FROM users as u, permissions as p
    WHERE u.id = p.user_id
    AND u.id=? AND p.section_id=?
    AND p.can_add_game=TRUE OR p.is_owner = TRUE`,
    [userID, sectionID],
    (error, results, fields) => {
      if(!error){
        if(results.length == 0){
          resolve(false);
        }else{
          resolve(true);
        }
      }else{
        //error executing query
        reject({
          reason: "Errore interno al server, riprova più tardi",
          debug: `[MYSQL] Error executing canAddSectionGame: ${error}`
        });
      }
    })
  })
}

async function canDeleteSectionGame(userID, sectionID){
  return new Promise((resolve, reject) => {
    let connection = _initConnection();
    connection.query(
    `SELECT u.id 
    FROM users as u, permissions as p
    WHERE u.id = p.user_id
    AND u.id=? AND p.section_id=?
    AND p.can_delete_game=TRUE OR p.is_owner = TRUE`,
    [userID, sectionID],
    (error, results, fields) => {
      if(!error){
        if(results.length == 0){
          resolve(false);
        }else{
          resolve(true);
        }
      }else{
        //error executing query
        reject({
          reason: "Errore interno al server, riprova più tardi",
          debug: `[MYSQL] Error executing canDeleteSectionGame: ${error}`
        });
      }
    })
  })
}

async function canUpdateSectionGame(userID, sectionID){
  return new Promise((resolve, reject) => {
    let connection = _initConnection();
    connection.query(
    `SELECT u.id 
    FROM users as u, permissions as p
    WHERE u.id = p.user_id
    AND u.id=? AND p.section_id=?
    AND p.can_update_game=TRUE OR p.is_owner = TRUE`,
    [userID, sectionID],
    (error, results, fields) => {
      if(!error){
        if(results.length == 0){
          resolve(false);
        }else{
          resolve(true);
        }
      }else{
        //error executing query
        reject({
          reason: "Errore interno al server, riprova più tardi",
          debug: `[MYSQL] Error executing canUpdateSectionGame: ${error}`
        });
      }
    })
  })
}

//
//                      PERMISSIONS
//
async function getSectionPermission(userID, sectionID){
  return new Promise((resolve, reject) => {
    let connection = _initConnection();
    connection.query(
    `SELECT can_add_game, can_delete_game, can_update_game, can_add_people, can_modify_permissions, is_owner
    FROM permissions
    WHERE user_id = ?
    AND section_id = ?`,
    [userID, sectionID],
    (error, results, fields) => {
      if(!error){
        if(results.length != 0){
          let sectionPermission = new SectionPermissionsQuery(results[0]);
          resolve(sectionPermission);
        }else{
          //length is 0
          reject({
            reason: "Errore interno al server, riprova più tardi",
            debug: `[MYSQL] Didn't find anything from this query`
          });
        }
      }else{
        //error executing query
        reject({
          reason: "Errore interno al server, riprova più tardi",
          debug: `[MYSQL] Error executing canUpdateSectionGame: ${error}`
        });
      }
    })
  })
}

async function getGamePermission(gameID){
  return new Promise((resolve, reject) => {
    let connection = _initConnection();
    connection.query(
    `SELECT users.firstname, users.lastname, owner_id, game_id, can_update_game
    FROM gamePermissions, users
    WHERE game_id = ?
    AND gamePermissions.owner_id = users.id`,
    [gameID],
    (error, results, fields) => {
      if(!error){
        if(results.length != 0){
          let gamePermissions = new GamePermissionsQuery(results[0]);
          resolve(gamePermissions);
        }else{
          //length is 0
          reject({
            reason: "Non sono state trovati i permessi relativi al gioco selezionato",
            debug: `[MYSQL] Didn't find anything from this query`
          });
        }
      }else{
        //error executing query
        reject({
          reason: "Errore interno al server, riprova più tardi",
          debug: `[MYSQL] Error executing canUpdateSectionGame: ${error}`
        });
      }
    })
  })
}

async function setGamePermission(permissions){
  return new Promise((resolve, reject) => {
    let connection = _initConnection();
    connection.query(
    `UPDATE gamePermissions SET
    can_update_game=?,
    owner_id = ?
    WHERE
    game_id = ?`,
    [permissions.canUpdateGame, permissions.ownerID, permissions.gameID],
    (error, results, fields) => {
      if(!error){
        if(results.affectedRows == 0){
          reject({
            reason: "Impossibile aggiornare il gioco",
            debug: `[MYSQL] Error: 0 affected rows for owner: ${permissions.ownerID}, game: ${permissions.gameID}`
          })
        }else{
          resolve(true);
        }
      }else{
        //error executing query
        reject({
          reason: "Errore interno al server, riprova più tardi",
          debug: `[MYSQL] Error executing canUpdateSectionGame: ${error}`
        });
      }
    })
  })
}

async function addGamePermission(permissions){
  return new Promise((resolve, reject) => {
    let connection = _initConnection();
    connection.query(
    `INSERT INTO gamePermissions (can_update_game, owner_id, game_id) VALUES 
    (?,?,?)`,
    [permissions.canUpdateGame, permissions.ownerID, permissions.gameID],
    (error, results, fields) => {
      if(!error){
        if(results.affectedRows == 0){
          reject({
            reason: "Impossibile inserire il gioco",
            debug: `[MYSQL] Error: 0 affected rows for owner: ${permissions.ownerID}, game: ${permissions.gameID}`
          })
        }else{
          resolve(true);
        }
      }else{
        //error executing query
        reject({
          reason: "Errore interno al server, riprova più tardi",
          debug: `[MYSQL] Error executing addGamePermission: ${error}`
        });
      }
    })
  })
}

const SQL = {
  login: _login,
  register: _register,
  getUserId: _getUserId,
  verify: _verify,
  mailExistAndVerified: _mailExistAndVerified,
  updatePassword: _updatePassword,
  updateEmail: _updateEmail,
  mailExist: _mailExist,
  userIsWhitelist: _userIsWhitelist,

  addGame: _addGame,
  gameList: _gameList,
  gameListWithPermission,
  gameIsUsed: _gameIsUsed,
  getGame: _getGame,
  deleteGame: _deleteGame,
  updateGame: _updateGame,

  addSection: _addSection,
  modifySection: _modifySection,
  deleteSection: _deleteSection,
  getSection: _getSection,
  isSectionOwner: _isSectionOwner,
  sectionExist: _sectionExist,
  canModifySectionPermission,
  canAddPeopleAndModify,
  canAddPeople,
  canAccessSection,
  addUserInSection,
  removeUserInSection,
  updateUserPermission,
  addUserInSectionWithoutPermission,
  sectionUserList,

  getHolders,
  addHolder,
  removeHolder,
  editHolder,
  existHolder,
  canAddHolder,

  sectionGameList,
  addSectionGame,
  getSectionGame,
  deleteSectionGame,
  updateSectionGame,

  canAddSectionGame,
  canDeleteSectionGame,
  canUpdateSectionGame,

  getSectionPermission,
  getGamePermission,
  setGamePermission,
  addGamePermission,
};

module.exports = SQL;
