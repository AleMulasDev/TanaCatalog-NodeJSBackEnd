class SectionPermissionsQuery{
  constructor({user_id, section_id, can_add_game, can_delete_game, 
              can_update_game, can_add_people, can_modify_permissions, is_owner}){
    this.userID = user_id;
    this.sectionID = section_id;
    this.canAddGame = can_add_game;
    this.canDeleteGame = can_delete_game;
    this.canUpdateGame = can_update_game;
    this.canAddPeople = can_add_people;
    this.canModifyPermissions = can_modify_permissions;
    this.isOwner = is_owner;
  }
}

class SectionPermissions{
  constructor({userID, sectionID, canAddGame, canDeleteGame, 
              canUpdateGame, canAddPeople, canModifyPermissions, isOwner}){
    this.userID = userID;
    this.sectionID = sectionID;
    this.canAddGame = canAddGame;
    this.canDeleteGame = canDeleteGame;
    this.canUpdateGame = canUpdateGame;
    this.canAddPeople = canAddPeople;
    this.canModifyPermissions = canModifyPermissions;
    this.isOwner = isOwner;
  }
}

module.exports = {SectionPermissionsQuery, SectionPermissions};