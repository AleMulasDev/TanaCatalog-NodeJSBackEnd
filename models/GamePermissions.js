class GamePermissionsQuery{
  constructor({firstname, lastname, owner_id, game_id, can_update_game}){
    this.name = `${firstname} ${lastname}`
    this.ownerID = owner_id;
    this.gameID = game_id;
    this.canUpdateGame = can_update_game;
  }
}

class GamePermissions{
  constructor({name, ownerID, gameID, canUpdateGame}){
    this.name = name;
    this.ownerID = ownerID;
    this.gameID = gameID;
    this.canUpdateGame = canUpdateGame;
  }
}

class GamePermissionRequest{
  constructor({ownerID, gameID, canUpdateGame}){
    this.ownerID = ownerID;
    this.gameID = gameID;
    this.canUpdateGame = canUpdateGame;
  }
}

module.exports = {GamePermissionsQuery, GamePermissions, GamePermissionRequest};