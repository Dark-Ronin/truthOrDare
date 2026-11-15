
const Game = {
  truths: [],
  dares: [],
  mode: null,

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

  async load(mode = "normal") {
    if (!["normal", "adult"].includes(mode)) {
      throw new Error("Modo de jogo inválido.");
    }

    this.mode = mode;

    const folder = mode === "adult" ? "adult" : "normal";

    const [truths, dares] = await Promise.all([
      fetch(`data/${folder}/truths.json`)
        .then(response => {
          if (!response.ok) throw new Error("Erro ao carregar verdades.");
          return response.json();
        }),

      fetch(`data/${folder}/dares.json`)
        .then(response => {
          if (!response.ok) throw new Error("Erro ao carregar consequências.");
          return response.json();
        })
    ]);

    this.truths = truths;
    this.dares = dares;

    this.settings = {
      ...this.settings,
      ...Storage.get(`settings-${mode}`, {})
    };

    this.used = { truth: [], dare: [] };
    this.history = [];
    this.currentPrompt = null;
  },

  start() {
    this.history = [];
    this.used = { truth: [], dare: [] };
    this.round = 0;
    this.previousPlayerId = null;
    this.currentPrompt = null;

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
    if (!this.currentPrompt || !this.currentPlayer) return;

    this.history.unshift({
      player: this.currentPlayer.name,
      type: this.currentPrompt.type,
      text: this.currentPrompt.text
    });
  }
};
