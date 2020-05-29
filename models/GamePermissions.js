class GamePermissionsQuery{
  constructor({firstname, lastname, is_owner, game_id, can_update_game, owner_id}){
    this.name = `${firstname} ${lastname}`
    this.isOwner = is_owner;
    this.ownerID = owner_id
    this.gameID = game_id;
    this.canUpdateGame = can_update_game;
  }
}

class GamePermissions{
  constructor(obj){
    if(obj){
      var {name, isOwner, gameID, canUpdateGame, ownerID} = obj;
      this.name = name || undefined;
      this.isOwner = isOwner || undefined;
      this.gameID = gameID || undefined;
      this.canUpdateGame = canUpdateGame || 1;
      this.ownerID = ownerID || undefined;
    }else{
      this.name = undefined;
      this.isOwner = undefined;
      this.gameID = undefined;
      this.canUpdateGame = 1;
      this.ownerID = undefined;
    }
  }
}

class GamePermissionRequest{
  constructor(obj){
    if(obj){
      const {userID, isOwner, gameID, canUpdateGame} = obj;
      this.userID = userID;
      this.isOwner = isOwner;
      this.gameID = gameID;
      this.canUpdateGame = canUpdateGame;
    }
  }
}

module.exports = {GamePermissionsQuery, GamePermissions, GamePermissionRequest};