
class GameQuery{
  constructor(query_results){
    this.id = query_results["id"] ? query_results["id"] : null
    this.title = query_results["title"] ? query_results["title"] : null
    this.link_tdg = query_results["link_tdg"] ? query_results["link_tdg"] : null
    this.players = query_results["players"] ? query_results["players"] : null
    this.playtime = query_results["playtime"] ? query_results["playtime"] : null
    this.age = query_results["age"] ? query_results["age"] : null
    this.gamebgg_id = query_results["gamebgg_id"] ? query_results["gamebgg_id"] : null
  }

  getObj(){
    return { 
      id: this.id,
      title: this.title, 
      link_tdg: this.link_tdg, 
      players: this.players, 
      playtime: this.playtime, 
      age: this.age, 
      gamebgg_id: this.gamebgg_id
    };
  }
}

class Game{
  constructor({id, title, link_tdg, players, playtime, age, gamebgg_id}){
    this.id = id ? id : undefined;
    this.title = title;
    this.link_tdg = link_tdg;
    this.players = players;
    this.playtime = playtime;
    this.age = age;
    this.gamebgg_id = gamebgg_id;
  }

  hasId(){
    return this.id ? true : false;
  }

  getObj(){
    if(id){
      return { 
        id: this.id,
        title: this.title, 
        link_tdg: this.link_tdg, 
        players: this.players, 
        playtime: this.playtime, 
        age: this.age, 
        gamebgg_id: this.gamebgg_id
      };
    }else{
      return {
        title: this.title, 
        link_tdg: this.link_tdg, 
        players: this.players, 
        playtime: this.playtime, 
        age: this.age, 
        gamebgg_id: this.gamebgg_id
      };
    }
  }
}


module.exports = {GameQuery, Game};