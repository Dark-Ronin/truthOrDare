
const Players = {
  list: [],

  load() {
    this.list = Storage.get("players", []);
  },

  add(name) {
    name = name.trim();

    if (!name) return false;

    if (this.list.some(p => p.name.toLowerCase() === name.toLowerCase())) {
      return false;
    }

    this.list.push({
      id: crypto.randomUUID(),
      name
    });

    Storage.set("players", this.list);
    return true;
  },

  remove(id) {
    this.list = this.list.filter(p => p.id !== id);
    Storage.set("players", this.list);
  },

  draw(previousId) {
    let pool = this.list.filter(p => p.id !== previousId);

    if (!pool.length) pool = this.list;

    return pool[Math.floor(Math.random() * pool.length)];
  }
};
