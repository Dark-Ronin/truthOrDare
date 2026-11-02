
const $ = selector => document.querySelector(selector);

const setup = $("#setup-panel");
const game = $("#game-panel");
const result = $("#result-panel");
const historyPanel = $("#history-panel");

// RENDERIZAÇÃO DOS JOGADORES

function renderPlayers() {
  const container = $("#player-list");
  container.innerHTML = "";

  Players.list.forEach(player => {
    const chip = document.createElement("div");
    chip.className = "player-chip";

    const name = document.createElement("span");
    name.textContent = player.name;

    const remove = document.createElement("button");
    remove.textContent = "×";

    remove.onclick = () => {
      Players.remove(player.id);
      renderPlayers();
    };

    chip.append(name, remove);
    container.append(chip);
  });

  $("#start-game").disabled = Players.list.length < 2;
}

// RENDERIZAÇÃO DA VEZ

function renderTurn(animate = false) {
  if (!Game.currentPlayer) return;

  const player = Game.currentPlayer;

  $("#current-player").textContent = player.name;
  $("#turn-count").textContent = `RODADA ${Game.round}`;

  if (animate) {
    runRoulette(
      player.name,
      Players.list.map(p => p.name)
    );
  }
}

// HISTÓRICO

function renderHistory() {
  const container = $("#history-list");
  container.innerHTML = "";

  Game.history.forEach(item => {
    const entry = document.createElement("div");

    entry.textContent =
      `${item.player}: ${item.type.toUpperCase()} — ${item.text}`;

    container.append(entry);
  });
}

// MOSTRAR DESAFIO

function showPrompt(type) {
  const prompt = Game.getPrompt(type);

  if (!prompt) {
    alert("Não existem desafios disponíveis neste nível.");
    return;
  }

  game.classList.add("hidden");
  result.classList.remove("hidden");

  $("#prompt-type").textContent =
    type === "truth" ? "VERDADE" : "CONSEQUÊNCIA";

  $("#prompt-category").textContent = prompt.category;
  $("#prompt-level").textContent = `NÍVEL ${prompt.level}`;
  $("#prompt-text").textContent = prompt.text;
}

// ADICIONAR JOGADORES

$("#player-form").addEventListener("submit", event => {
  event.preventDefault();

  const input = $("#player-name");

  if (!Players.add(input.value)) {
    alert("Nome inválido ou já existente.");
    return;
  }

  input.value = "";
  renderPlayers();
});

// COMEÇAR JOGO

$("#start-game").onclick = () => {
  Game.start();

  setup.classList.add("hidden");
  game.classList.remove("hidden");
  historyPanel.classList.remove("hidden");

  renderTurn(true);
};

// ESCOLHER VERDADE OU CONSEQUÊNCIA

document.querySelectorAll(".choices button").forEach(button => {
  button.onclick = () => {
    showPrompt(button.dataset.type);
  };
});

// VOLTAR AO JOGADOR

$("#back-to-turn").onclick = () => {
  result.classList.add("hidden");
  game.classList.remove("hidden");
};

// TROCAR DESAFIO

$("#skip-prompt").onclick = () => {
  if (Game.currentPrompt) {
    showPrompt(Game.currentPrompt.type);
  }
};

// CONCLUIR DESAFIO

$("#complete-prompt").onclick = () => {
  Game.record();
  renderHistory();

  Game.nextPlayer();
  renderTurn(true);

  result.classList.add("hidden");
  game.classList.remove("hidden");
};

// PASSAR JOGADOR

$("#next-player").onclick = () => {
  Game.nextPlayer();
  renderTurn(true);
};

// TERMINAR SESSÃO

$("#end-game").onclick = () => {
  if (!confirm("Terminar esta sessão?")) return;

  Game.history = [];
  Game.used = { truth: [], dare: [] };
  Game.currentPlayer = null;
  Game.currentPrompt = null;
  Game.round = 1;

  game.classList.add("hidden");
  result.classList.add("hidden");
  historyPanel.classList.add("hidden");
  setup.classList.remove("hidden");

  renderPlayers();
  renderHistory();
};

// CONFIGURAÇÕES

$("#settings-open").onclick = () => {
  $("#max-level").value = Game.settings.maxLevel;
  $("#allow-repeats").checked = Game.settings.allowRepeats;
  $("#include-spicy").checked = Game.settings.includeSpicy;

  $("#settings-dialog").showModal();
};

$("#save-settings").onclick = () => {
  Game.settings = {
    maxLevel: Number($("#max-level").value),
    allowRepeats: $("#allow-repeats").checked,
    includeSpicy: $("#include-spicy").checked
  };

  Storage.set("settings", Game.settings);

  $("#settings-dialog").close();
};

// ROULETTE ANIMATION

const rouletteOverlay = $("#roulette-overlay");
const rouletteName = $("#roulette-name");
const rouletteStatus = $("#roulette-status");

let rouletteRunning = false;

function runRoulette(finalName, players) {
  if (
    rouletteRunning ||
    !finalName ||
    players.length < 2
  ) return;

  rouletteRunning = true;

  rouletteOverlay.classList.remove("hidden", "revealed");

  rouletteName.textContent = "???";
  rouletteStatus.textContent = "A escolher o próximo jogador...";

  let elapsed = 0;
  let delay = 50;

  function spin() {
    const randomPlayer =
      players[Math.floor(Math.random() * players.length)];

    rouletteName.textContent = randomPlayer;

    elapsed += delay;

    if (elapsed >= 3000) {
      rouletteName.textContent = finalName;
      rouletteStatus.textContent = "O destino escolheu.";

      rouletteOverlay.classList.add("revealed");

      setTimeout(() => {
        rouletteOverlay.classList.add("hidden");
        rouletteRunning = false;
      }, 1800);

      return;
    }

    delay += elapsed > 1800 ? 15 : 0;

    setTimeout(spin, delay);
  }

  spin();
}

// INICIALIZAÇÃO

async function init() {
  Players.load();
  renderPlayers();

  try {
    await Game.load();
  } catch (error) {
    console.error(error);

    alert(
      "Erro ao carregar os ficheiros JSON. Usa Live Server."
    );
  }
}

init();
