class SectionGames{
  constructor({id, game_id, section_id, is_new, acquisition_date, origin, propriety, holder_id}){
    this.id = id;
    this.game_id = game_id;
    this.section_id = section_id;
    this.is_new = is_new;
    this.acquisition_date = acquisition_date;
    this.origin = origin;
    this.propriety = propriety;
    this.holder_id = holder_id;
  }
}

class SectionGamesQuery{
  constructor({id, game_id, section_id, is_new, acquisition_date, origin, propriety, holder_id, holder_title, game_title}){
    this.id = id;
    this.game_id = game_id;
    this.section_id = section_id;
    this.is_new = is_new;
    this.acquisition_date = acquisition_date;
    this.origin = origin;
    this.propriety = propriety;
    this.holder_id = holder_id;
    this.holder_title = holder_title;
    this.game_title = game_title;
  }
}
module.exports = {SectionGames, SectionGamesQuery};