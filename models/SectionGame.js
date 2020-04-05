class SectionGames{
  constructor({id, gameID, sectionID, isNew, acquisitionDate, origin, propriety, holderID}){
    this.id = id;
    this.gameID = gameID;
    this.sectionID = sectionID;
    this.isNew = isNew;
    this.acquisitionDate = acquisitionDate;
    this.origin = origin;
    this.propriety = propriety;
    this.holderID = holderID;
  }
}

class SectionGamesQuery{
  constructor({id, game_id, section_id, is_new, acquisition_date, origin, propriety, holder_id, holder_title, game_title}){
    this.id = id;
    this.gameID = game_id;
    this.sectionID = section_id;
    this.isNew = is_new;
    this.acquisitionDate = acquisition_date;
    this.origin = origin;
    this.propriety = propriety;
    this.holderID = holder_id;
    this.holderTitle = holder_title;
    this.gameTitle = game_title;
  }
}
module.exports = {SectionGames, SectionGamesQuery};