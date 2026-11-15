
const $ = selector => document.querySelector(selector);

const setup = $("#setup-panel");
const game = $("#game-panel");
const result = $("#result-panel");
const historyPanel = $("#history-panel");
const modePanel = $("#mode-panel");
const adultConfirmation = $("#adult-confirmation");

let selectedMode = null;

// ===================================
// NAVEGAÇÃO ENTRE MODOS
// ===================================

function showPanel(panel) {
  [
    modePanel,
    adultConfirmation,
    setup,
    game,
    result,
    historyPanel
  ].forEach(item => item.classList.add("hidden"));

  panel.classList.remove("hidden");
}

function activateMode(mode) {
  selectedMode = mode;

  document.body.classList.toggle(
    "mode-adult",
    mode === "adult"
  );

  showPanel(setup);
}

document.querySelectorAll(".mode-card").forEach(button => {
  button.addEventListener("click", () => {
    const mode = button.dataset.mode;

    if (mode === "adult") {
      showPanel(adultConfirmation);
      return;
    }

    activateMode("normal");
  });
});

$("#confirm-adult").addEventListener("click", () => {
  activateMode("adult");
});

$("#cancel-adult").addEventListener("click", () => {
  showPanel(modePanel);
});

$("#change-mode").addEventListener("click", () => {
  selectedMode = null;
  document.body.classList.remove("mode-adult");
  showPanel(modePanel);
});

// ===================================
// JOGADORES
// ===================================

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
    remove.setAttribute("aria-label", `Remover ${player.name}`);

    remove.onclick = () => {
      Players.remove(player.id);
      renderPlayers();
    };

    chip.append(name, remove);
    container.append(chip);
  });

  $("#start-game").disabled = Players.list.length < 2;
}

// ===================================
// TURNO
// ===================================

function renderTurn(animate = false) {
  if (!Game.currentPlayer) return;

  $("#current-player").textContent = Game.currentPlayer.name;
  $("#turn-count").textContent = `RODADA ${Game.round}`;

  if (animate) {
    runRoulette(
      Game.currentPlayer.name,
      Players.list.map(player => player.name)
    );
  }
}

// ===================================
// HISTÓRICO
// ===================================

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

// ===================================
// DESAFIOS
// ===================================

function showPrompt(type) {
  const prompt = Game.getPrompt(type);

  if (!prompt) {
    alert("Não existem desafios disponíveis neste nível.");
    return;
  }

  showPanel(result);

  $("#prompt-type").textContent =
    type === "truth" ? "VERDADE" : "CONSEQUÊNCIA";

  $("#prompt-category").textContent = prompt.category;
  $("#prompt-level").textContent = `NÍVEL ${prompt.level}`;
  $("#prompt-text").textContent = prompt.text;
}

// ===================================
// ADICIONAR JOGADORES
// ===================================

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

// ===================================
// COMEÇAR JOGO
// ===================================

$("#start-game").addEventListener("click", async () => {
  if (!selectedMode) return;

  try {
    await Game.load(selectedMode);
    Game.start();

    showPanel(game);
    historyPanel.classList.remove("hidden");

    renderHistory();
    renderTurn(true);
  } catch (error) {
    console.error(error);
    alert("Não foi possível carregar os desafios deste modo.");
  }
});

// ===================================
// ESCOLHER VERDADE OU CONSEQUÊNCIA
// ===================================

document.querySelectorAll(".choices button").forEach(button => {
  button.addEventListener("click", () => {
    showPrompt(button.dataset.type);
  });
});

// ===================================
// VOLTAR AO TURNO
// ===================================

$("#back-to-turn").addEventListener("click", () => {
  showPanel(game);
  historyPanel.classList.remove("hidden");
});

// ===================================
// TROCAR DESAFIO
// ===================================

$("#skip-prompt").addEventListener("click", () => {
  if (Game.currentPrompt) {
    showPrompt(Game.currentPrompt.type);
  }
});

// ===================================
// CONCLUIR DESAFIO
// ===================================

$("#complete-prompt").addEventListener("click", () => {
  Game.record();
  renderHistory();

  Game.nextPlayer();

  showPanel(game);
  historyPanel.classList.remove("hidden");

  renderTurn(true);
});

// ===================================
// PASSAR JOGADOR
// ===================================

$("#next-player").addEventListener("click", () => {
  Game.nextPlayer();
  renderTurn(true);
});

// ===================================
// TERMINAR SESSÃO
// ===================================

$("#end-game").addEventListener("click", () => {
  if (!confirm("Terminar esta sessão?")) return;

  Game.history = [];
  Game.used = { truth: [], dare: [] };
  Game.currentPlayer = null;
  Game.currentPrompt = null;
  Game.round = 1;

  renderHistory();
  renderPlayers();

  showPanel(setup);
});

// ===================================
// CONFIGURAÇÕES
// ===================================

$("#settings-open").addEventListener("click", () => {
  $("#max-level").value = Game.settings.maxLevel;
  $("#allow-repeats").checked = Game.settings.allowRepeats;
  $("#include-spicy").checked = Game.settings.includeSpicy;

  $("#settings-dialog").showModal();
});

$("#save-settings").addEventListener("click", () => {
  Game.settings = {
    maxLevel: Number($("#max-level").value),
    allowRepeats: $("#allow-repeats").checked,
    includeSpicy: $("#include-spicy").checked
  };

  Storage.set(
    `settings-${selectedMode || "normal"}`,
    Game.settings
  );
  $("#settings-dialog").close();
});

$("#close-settings").addEventListener("click", () => {
  $("#settings-dialog").close();
});

// ===================================
// ROLETA
// ===================================

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

    if (elapsed >= 500) {
      rouletteName.textContent = finalName;
      rouletteStatus.textContent = "Tua vez!";

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

// ===================================
// INICIALIZAÇÃO
// ===================================

async function init() {
  Players.load();
  renderPlayers();

  try {
    await Game.load();
  } catch (error) {
    console.error(error);
    alert("Erro ao carregar os ficheiros JSON. Usa Live Server.");
  }

  showPanel(modePanel);
}

init();
