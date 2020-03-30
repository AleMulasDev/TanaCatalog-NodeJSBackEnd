class Holders{
  constructor({id, section_id, title, address, cap, city}){
    this.id = id ? id : undefined;
    this.section_id = section_id ? section_id : undefined;
    this.title = title;
    this.address = address;
    this.cap = cap;
    this.city = city;
  }

  hasId(){
    return this.id ? true : false;
  }
}
module.exports = Holders;