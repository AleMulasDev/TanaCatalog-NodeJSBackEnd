
class GameQuery{
  constructor(query_results){
    if(!query_results) return;
    if(Array.isArray(query_results)) query_results = query_results[0];
    this.id = query_results["id"] || undefined
    this.title = query_results["title"] || undefined
    this.description = query_results["description"] || undefined
    this.link_tdg = query_results["link_tdg"] || undefined
    this.players = query_results["players"] || undefined
    this.playtime = query_results["playtime"] || undefined
    this.age = query_results["age"] || undefined
    this.gamebgg_id = query_results["gamebgg_id"] || undefined
    this.image = query_results["image"] || undefined
    this.thumbnail = query_results["thumbnail"] || undefined
    this.price = query_results["price"] || undefined
    this.firstname = query_results["firstname"]
    this.lastname = query_results["lastname"]
    this.can_update_game = query_results["can_update_game"]
    this.owner_id = query_results["owner_id"]
    this.canEdit = query_results["canEdit"] || undefined
    this.isOwner = query_results["isOwner"] || undefined
  }

  getObj(){
    return { 
      id: this.id,
      title: this.title,
      description: this.description,
      link_tdg: this.link_tdg,
      players: this.players,
      playtime: this.playtime,
      age: this.age,
      gamebgg_id: this.gamebgg_id,
      image: this.image,
      thumbnail: this.thumbnail,
      price: this.price
    };
  }
}

class Game{
  constructor({id, owner_id, title, description, link_tdg, players, playtime, age, gamebgg_id, image, thumbnail, price,
    firstname, lastname, can_update_game, canEdit, isOwner}){
    this.id = id ? id : undefined;
    this.ownerID = owner_id;
    this.title = title;
    this.description = description
    this.link_tdg = link_tdg;
    this.players = players;
    this.playtime = playtime;
    this.age = age;
    this.gamebgg_id = gamebgg_id;
    this.image = image;
    this.thumbnail = thumbnail;
    this.price = price;
    this.owner = firstname && lastname ? `${firstname} ${lastname}` : undefined;
    this.canUpdateGame = can_update_game;
    this.canEdit = canEdit || undefined;
    this.isOwner = isOwner || undefined;
  }

  hasId(){
    return this.id ? true : false;
  }
}


module.exports = {GameQuery, Game};