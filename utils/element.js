class element {
  constructor(obj = {}) {
    this.events = {};
    for (let i in obj.events) {
      this[i] = obj.events[i].bind(this);
      this.events[i] = obj.events[i];
    }
    for (let i in obj.methods) {
      if (typeof obj.methods[i] == 'function'){
        this[i] = obj.methods[i].bind(this);
      }else{
        this[i] = obj.methods[i];
      }
    }
  }
}
module.exports = element;