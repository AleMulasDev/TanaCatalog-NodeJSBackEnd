class SectionUser{
  constructor({userID, name, email, permission}){
    this.userID = userID;
    this.name = name;
    this.email = email;
    this.permission = permission;
  }
}

class SectionUserQuery{
  constructor(result){
    let {user_id, firstname, lastname, email} = result;
    this.userID = user_id;
    this.name = `${firstname} ${lastname}`
    this.email = email;
    this.permission = new UserPermission(result);
  }
}

class UserPermission{
  constructor({can_add_game, can_delete_game, 
              can_update_game, can_add_people, can_modify_permissions, is_owner}){
    this.canAddGame = can_add_game;
    this.canDeleteGame = can_delete_game;
    this.canUpdateGame = can_update_game;
    this.canAddPeople = can_add_people;
    this.canModifyPermissions = can_modify_permissions;
    this.isOwner = is_owner;
  }
}
module.exports = {SectionUser, SectionUserQuery, UserPermission};