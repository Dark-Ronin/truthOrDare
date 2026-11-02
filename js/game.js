
const Game = {
  truths: [],
  dares: [],
  settings: {
    maxLevel: 3,
    allowRepeats: false,
    includeSpicy: true
  },

  used: {
    truth: [],
    dare: []
  },

  history: [],
  currentPlayer: null,
  previousPlayerId: null,
  round: 0,
  currentPrompt: null,

  async load() {
    const [truths, dares] = await Promise.all([
      fetch("data/truths.json").then(r => r.json()),
      fetch("data/dares.json").then(r => r.json())
    ]);

    this.truths = truths;
    this.dares = dares;

    this.settings = {
      ...this.settings,
      ...Storage.get("settings", {})
    };
  },

  start() {
    this.history = [];
    this.used = { truth: [], dare: [] };
    this.round = 0;
    this.previousPlayerId = null;
    this.nextPlayer();
  },

  nextPlayer() {
    this.currentPlayer = Players.draw(this.previousPlayerId);

    if (!this.currentPlayer) return;

    this.previousPlayerId = this.currentPlayer.id;
    this.round++;
  },

  getPrompt(type) {
    const source = type === "truth" ? this.truths : this.dares;

    let pool = source.filter(item =>
      item.level <= this.settings.maxLevel &&
      (this.settings.includeSpicy || item.category !== "Picante") &&
      (this.settings.allowRepeats || !this.used[type].includes(item.id))
    );

    if (!pool.length && !this.settings.allowRepeats) {
      this.used[type] = [];
      pool = source.filter(item =>
        item.level <= this.settings.maxLevel &&
        (this.settings.includeSpicy || item.category !== "Picante")
      );
    }

    if (!pool.length) return null;

    const item = pool[Math.floor(Math.random() * pool.length)];

    this.used[type].push(item.id);
    this.currentPrompt = { ...item, type };

    return this.currentPrompt;
  },

  record() {
    if (!this.currentPrompt) return;

    this.history.unshift({
      player: this.currentPlayer.name,
      type: this.currentPrompt.type,
      text: this.currentPrompt.text
    });
  }
};
