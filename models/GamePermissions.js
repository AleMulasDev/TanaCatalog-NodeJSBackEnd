class GamePermissionsQuery{
  constructor({firstname, lastname, owner_id, game_id, can_update_game}){
    this.name = `${firstname} ${lastname}`
    this.ownerID = owner_id;
    this.gameID = game_id;
    this.canUpdateGame = can_update_game;
  }
}

class GamePermissions{
  constructor(obj){
    if(obj){
      var {name, ownerID, gameID, canUpdateGame} = obj;
      this.name = name || undefined;
      this.ownerID = ownerID || undefined;
      this.gameID = gameID || undefined;
      this.canUpdateGame = canUpdateGame || 1;
    }else{
      this.name = undefined;
      this.ownerID = undefined;
      this.gameID = undefined;
      this.canUpdateGame = 1;
    }
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