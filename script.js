document.addEventListener("DOMContentLoaded", function () {
  console.log(wordsDictionaries);

  // Переменные игры
  let currentGame = 0;
  let letters = [];
  let selectedTileIndex = null;
  let currentWords = [];
  let initialLetters = [];
  let fixedIndices = [];
  let startTime = null;
  let endTime = null;
  let hintsUsed = 0;
  let isSolved = false;
  const board = document.getElementById("board");
  const messageEl = document.getElementById("message");
  const startScreen = document.getElementById("start-screen");
  let playAgainBtn = null;

  let hintMode = false;
  let highlightedTiles = [];

  // Add to setupModals()
  const versionInfo = document.querySelector(".version-info");
  versionInfo.addEventListener("click", () => {
    document.getElementById("version-modal").style.display = "flex";
  });

  // Аудио
  const moveSound = new Audio("move.mp3");
  moveSound.volume = 0.5;

  const winSound = new Audio("win.mp3");
  winSound.volume = 0.7;

  // Фоновая музыка
  const backgroundMusic = new Audio();
  backgroundMusic.loop = true;
  let isMusicPlaying = false;
  let currentThemeMusic = "";

  // Инициализация игры
  function initGame() {
    initTheme();
    setupThemeSwitcher();
    setupEventListeners();
    switchGame(0);
    setupModals();
    setupAudioControls();
  }

  // Настройка аудио контролов
  function setupAudioControls() {
    const audioToggle = document.getElementById("audio-toggle");
    const volumeSlider = document.getElementById("volume-slider");

    audioToggle.addEventListener("click", () => {
      if (isMusicPlaying) {
        backgroundMusic.pause();
        audioToggle.textContent = "🔇";
      } else {
        backgroundMusic.play();
        audioToggle.textContent = "🔊";
      }
      isMusicPlaying = !isMusicPlaying;
    });

    volumeSlider.addEventListener("input", (e) => {
      const volume = e.target.value;
      backgroundMusic.volume = volume;
      moveSound.volume = volume * 0.5;
      winSound.volume = volume * 0.7;
    });
  }

  // Установка фоновой музыки в зависимости от темы
  function setThemeMusic(theme) {
    if (currentThemeMusic === theme) return;

    currentThemeMusic = theme;
    backgroundMusic.src = `${theme}.mp3`;

    if (isMusicPlaying) {
      backgroundMusic
        .play()
        .catch((e) => console.log("Autoplay prevented:", e));
    }
  }

  // Настройка модальных окон
  function setupModals() {
    // Инструкция
    const helpBtn = document.getElementById("help-btn");
    const instructionModal = document.getElementById("instruction-modal");
    const videoInstruction = document.getElementById("instruction-video");
    const closeButtons = document.querySelectorAll(".close-modal");
    const instructionTabs = document.querySelectorAll(".instruction-tab");

    helpBtn.addEventListener("click", () => {
      instructionModal.style.display = "flex";
    });

    instructionTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        document
          .querySelector(".instruction-tab.active")
          .classList.remove("active");
        document
          .querySelector(".instruction-content.active")
          .classList.remove("active");

        tab.classList.add("active");
        const tabId = tab.dataset.tab;
        document.getElementById(`${tabId}-instruction`).classList.add("active");

        if (tabId === "video") {
          videoInstruction.play();
        } else {
          videoInstruction.pause();
          videoInstruction.currentTime = 0;
        }
      });
    });

    // Закрытие модального окна останавливает видео
    closeButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        videoInstruction.pause();
        videoInstruction.currentTime = 0;
        document.querySelectorAll(".modal").forEach((modal) => {
          modal.style.display = "none";
        });
      });
    });

    window.addEventListener("click", (e) => {
      if (e.target.classList.contains("modal")) {
        videoInstruction.pause();
        videoInstruction.currentTime = 0;
        e.target.style.display = "none";
      }
    });

    // Поделиться
    const shareBtn = document.getElementById("share-btn");
    const shareModal = document.getElementById("share-modal");

    shareBtn.addEventListener("click", () => {
      prepareShareResult();
      shareModal.style.display = "flex";
    });
  }

  // Подготовка результата для публикации
  function prepareShareResult() {
    const wordLength = currentGame === 0 ? 3 : currentGame === 1 ? 4 : 5;
    const timeSpent = Math.floor((endTime - startTime) / 1000);

    // Получаем реально составленные слова
    const userWords = [];
    for (let i = 0; i < currentWords.length; i++) {
      const start = i * wordLength;
      const end = start + wordLength;
      userWords.push(letters.slice(start, end).join(""));
    }

    // Создаем скриншот всего игрового поля
    html2canvas(document.querySelector(".game-section"), {
      backgroundColor: null,
      scale: 0.8,
    }).then((canvas) => {
      const screenshot = canvas.toDataURL("image/png");
      const shareText = `Я разгадал слова в draword: ${userWords.join(
        ", "
      )} за ${timeSpent} секунд! ${screenshot}`;

      // Обновляем мета-тег для соцсетей
      document.querySelector('meta[property="og:image"]').content = screenshot;

      // Обновляем ссылки для шаринга
      const shareUrl = "https://usatblu27.github.io/draword";

      document.getElementById(
        "share-vk"
      ).href = `https://vk.com/share.php?url=${encodeURIComponent(
        shareUrl
      )}&title=draword&description=${encodeURIComponent(shareText)}`;

      document.getElementById(
        "share-telegram"
      ).href = `https://t.me/share/url?url=${encodeURIComponent(
        shareUrl
      )}&text=${encodeURIComponent(shareText)}`;

      document.getElementById(
        "share-whatsapp"
      ).href = `https://wa.me/?text=${encodeURIComponent(
        shareText + " " + shareUrl
      )}`;

      // Показываем скриншот в модальном окне
      const shareModal = document.getElementById("share-modal");
      const screenshotPreview = document.createElement("img");
      screenshotPreview.src = screenshot;
      screenshotPreview.style.maxWidth = "100%";
      shareModal.querySelector(".modal-content").prepend(screenshotPreview);
    });
  }

  // Инициализация темы
  function initTheme() {
    const savedTheme = localStorage.getItem("theme") || "default";
    document.body.className = `theme-${savedTheme}`;

    // Отмечаем выбранную тему
    document.querySelectorAll(".theme-option").forEach((option) => {
      option.classList.remove("selected");
      if (option.dataset.theme === savedTheme) {
        option.classList.add("selected");
      }
    });

    setThemeMusic(savedTheme);
  }

  // Переключение темы
  function setupThemeSwitcher() {
    const themeButton = document.getElementById("theme-button");
    const themePanel = document.getElementById("theme-panel");

    themeButton.addEventListener("click", () => {
      themePanel.classList.toggle("active");
    });

    document.querySelectorAll(".theme-option").forEach((option) => {
      option.addEventListener("click", () => {
        const theme = option.dataset.theme;
        document.body.className = `theme-${theme}`;
        localStorage.setItem("theme", theme);

        document.querySelectorAll(".theme-option").forEach((opt) => {
          opt.classList.remove("selected");
        });
        option.classList.add("selected");

        themePanel.classList.remove("active");

        setThemeMusic(theme);
      });
    });
  }

  // Настройка обработчиков событий
  function setupEventListeners() {
    document.querySelectorAll(".game-dot").forEach((dot) => {
      dot.addEventListener("click", () => {
        const gameIndex = parseInt(dot.dataset.game);
        switchGame(gameIndex);
      });
    });

    document.querySelector(".nav-arrow.left").addEventListener("click", () => {
      const dots = Array.from(document.querySelectorAll(".game-dot.active"));
      if (dots.length > 0) {
        const currentDot = dots[0];
        const currentIndex = parseInt(currentDot.dataset.game);
        const prevIndex = (currentIndex - 1 + 3) % 3;
        switchGame(prevIndex);
      }
    });

    document.querySelector(".nav-arrow.right").addEventListener("click", () => {
      const dots = Array.from(document.querySelectorAll(".game-dot.active"));
      if (dots.length > 0) {
        const currentDot = dots[0];
        const currentIndex = parseInt(currentDot.dataset.game);
        const nextIndex = (currentIndex + 1) % 3;
        switchGame(nextIndex);
      }
    });

    document.addEventListener("keydown", (e) => {
      const dots = Array.from(document.querySelectorAll(".game-dot.active"));
      if (dots.length > 0) {
        const currentDot = dots[0];
        const currentIndex = parseInt(currentDot.dataset.game);

        if (e.key === "ArrowLeft") {
          const prevIndex = (currentIndex - 1 + 3) % 3;
          switchGame(prevIndex);
        } else if (e.key === "ArrowRight") {
          const nextIndex = (currentIndex + 1) % 3;
          switchGame(nextIndex);
        }
      }
    });

    document.getElementById("start-btn").addEventListener("click", startGame);
    document
      .getElementById("answer-btn")
      .addEventListener("click", showCorrectAnswer);
    document.getElementById("hint-btn").addEventListener("click", giveHint);
  }

  // Переключение игры
  function switchGame(gameIndex) {
    currentGame = gameIndex;
    fixedIndices = [];
    isSolved = false;

    // Обновляем активную точку выбора игры
    document.querySelectorAll(".game-dot").forEach((dot) => {
      const dotGameIndex = parseInt(dot.dataset.game);
      dot.classList.toggle("active", dotGameIndex === gameIndex);
    });

    // Выбираем случайные слова
    const wordCount = gameIndex === 0 ? 3 : gameIndex === 1 ? 4 : 5;
    currentWords = selectRandomWords(
      wordsDictionaries[gameIndex].wordsToGuess,
      wordCount
    );

    // Сброс таймера и статистики
    startTime = new Date();
    endTime = null;
    hintsUsed = 0;

    resetGame();
  }

  // Начало игры
  function startGame() {
    startScreen.classList.add("hidden");
    resetGame();
  }

  // Выбор случайных слов
  function selectRandomWords(dictionary, count) {
    const shuffled = [...dictionary].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  // Отрисовка доски
  function renderBoard() {
    board.innerHTML = "";
    board.className = "board";

    const wordCount = currentGame === 0 ? 3 : currentGame === 1 ? 4 : 5;
    const wordLength = currentGame === 0 ? 3 : currentGame === 1 ? 4 : 5;
    const tileSize =
      currentGame === 0 ? "80px" : currentGame === 1 ? "80px" : "70px";

    // Устанавливаем CSS переменные
    board.style.setProperty("--columns", wordLength);
    board.style.setProperty("--tile-size", tileSize);

    for (let i = 0; i < wordCount; i++) {
      // Создаём строку
      const rowDiv = document.createElement("div");
      rowDiv.className = "word-row";

      // Добавляем индикатор правильности слова
      const indicator = document.createElement("div");
      indicator.className = "word-indicator";
      indicator.dataset.row = i;
      rowDiv.appendChild(indicator);

      // Добавляем плитки
      for (let j = 0; j < wordLength; j++) {
        const index = i * wordLength + j;
        const tile = document.createElement("div");
        tile.className = `tile tile-${wordLength}x${wordLength}`;
        tile.textContent = letters[index];
        tile.dataset.index = index;

        if (fixedIndices.includes(index)) {
          tile.classList.add("fixed");
        }

        tile.addEventListener("click", () => handleTileClick(index));
        rowDiv.appendChild(tile);
      }

      board.appendChild(rowDiv);

      // Добавляем разделитель (кроме последней строки)
      if (i < wordCount - 1) {
        const separator = document.createElement("div");
        separator.className = "word-separator";
        board.appendChild(separator);
      }
    }

    // Проверяем правильность слов
    checkWordsValidity();
  }

  // Проверка правильности слов (для индикаторов)
  function checkWordsValidity() {
    const wordLength = currentGame === 0 ? 3 : currentGame === 1 ? 4 : 5;
    const currentLetters = letters.join("");

    for (let i = 0; i < currentWords.length; i++) {
      const start = i * wordLength;
      const end = start + wordLength;
      const rowLetters = currentLetters.slice(start, end);
      const indicator = document.querySelector(
        `.word-indicator[data-row="${i}"]`
      );

      if (
        wordsDictionaries[currentGame].wordsForValidation.includes(rowLetters)
      ) {
        indicator.classList.add("correct");
      } else {
        indicator.classList.remove("correct");
      }
    }
  }

  // Обработка клика по плитке
  function handleTileClick(index) {
    if (hintMode) {
      handleHintSelection(index);
      return;
    }
    if (fixedIndices.includes(index)) return;

    const tiles = document.querySelectorAll(".tile");

    if (selectedTileIndex === null) {
      // Выбор первой плитки
      selectedTileIndex = index;
      tiles[index].classList.add("selected");
      messageEl.textContent = "";
    } else if (selectedTileIndex === index) {
      // Снятие выбора
      selectedTileIndex = null;
      tiles[index].classList.remove("selected");
      messageEl.textContent = "";
    } else {
      // Попытка поменять местами
      if (fixedIndices.includes(selectedTileIndex)) {
        tiles[selectedTileIndex].classList.remove("selected");
        selectedTileIndex = null;
        messageEl.textContent =
          "Невозможно поменять местами с фиксированной буквой";
        return;
      }

      // Воспроизводим звук перемещения
      moveSound.currentTime = 0;
      moveSound.play();

      // Анимация перемещения
      const tile1 = tiles[selectedTileIndex];
      const tile2 = tiles[index];

      tile1.classList.add("swap");
      tile2.classList.add("swap");

      // Получаем позиции плиток
      const rect1 = tile1.getBoundingClientRect();
      const rect2 = tile2.getBoundingClientRect();

      // Рассчитываем смещение
      const dx = rect2.left - rect1.left;
      const dy = rect2.top - rect1.top;

      // Применяем смещение
      tile1.style.transform = `translate(${dx}px, ${dy}px)`;
      tile2.style.transform = `translate(${-dx}px, ${-dy}px)`;

      // Меняем буквы местами в массиве
      [letters[selectedTileIndex], letters[index]] = [
        letters[index],
        letters[selectedTileIndex],
      ];

      // Снимаем выделение
      tile1.classList.remove("selected");
      selectedTileIndex = null;

      // Перерисовываем доску после завершения анимации
      setTimeout(() => {
        tile1.style.transform = "";
        tile2.style.transform = "";
        renderBoard();

        // Проверяем решение после каждого перемещения
        checkSolution();
      }, 500);
    }
  }

  // Проверка решения
  function checkSolution() {
    const wordLength = currentGame === 0 ? 3 : currentGame === 1 ? 4 : 5;
    const wordCount = currentGame === 0 ? 3 : currentGame === 1 ? 4 : 5;
    const currentLetters = letters.join("");

    let allCorrect = true;

    for (let i = 0; i < wordCount; i++) {
      const start = i * wordLength;
      const end = start + wordLength;
      const rowLetters = currentLetters.slice(start, end);

      // Проверяем наличие в словаре
      if (
        !wordsDictionaries[currentGame].wordsForValidation.includes(rowLetters)
      ) {
        allCorrect = false;
        break;
      }
    }

    if (allCorrect) {
      isSolved = true;
      endTime = new Date();
      messageEl.textContent = "Поздравляю! Вы решили головоломку!";
      messageEl.style.color = "var(--message-success)";

      // Воспроизводим звук победы
      winSound.currentTime = 0;
      winSound.play();

      animateSuccess();

      // Показываем кнопку "Поделиться"
      document.getElementById("share-btn").style.display = "block";

      if (!playAgainBtn) {
        playAgainBtn = document.createElement("button");
        playAgainBtn.textContent = "Играть дальше";
        playAgainBtn.id = "play-again-btn";
        playAgainBtn.addEventListener("click", () => {
          document.getElementById("share-btn").style.display = "none";
          resetGame();
        });
        document.querySelector(".controls").appendChild(playAgainBtn);
      }
    }
  }

  // Анимация успешного решения
  function animateSuccess() {
    const tiles = document.querySelectorAll(".tile");
    tiles.forEach((tile, i) => {
      setTimeout(() => {
        tile.classList.add("bounce");
        tile.addEventListener(
          "animationend",
          () => {
            tile.classList.remove("bounce");
          },
          { once: true }
        );
      }, i * 100);
    });
  }

  // Показать правильный ответ
  function showCorrectAnswer() {
    endTime = new Date();
    isSolved = false;

    // Создаем элементы с ссылками
    const answerContainer = document.createElement("div");
    currentWords.forEach((word) => {
      const wordLink = document.createElement("a");
      wordLink.href = `https://ru.wikipedia.org/wiki/${encodeURIComponent(
        word
      )}`;
      wordLink.target = "_blank";
      wordLink.textContent = word;
      wordLink.style.color = "var(--message-answer)";
      wordLink.style.margin = "0 5px";
      answerContainer.appendChild(wordLink);
    });

    messageEl.innerHTML = "";
    messageEl.appendChild(document.createTextNode("Ответы: "));
    messageEl.appendChild(answerContainer);
    messageEl.style.color = "var(--message-answer)";

    document.getElementById("share-btn").style.display = "none";

    if (!playAgainBtn) {
      playAgainBtn = document.createElement("button");
      playAgainBtn.textContent = "Играть заново";
      playAgainBtn.id = "play-again-btn";
      playAgainBtn.addEventListener("click", () => {
        document.getElementById("share-btn").style.display = "none";
        resetGame();
      });
      document.querySelector(".controls").appendChild(playAgainBtn);
    }
  }

  function giveHint() {
    if (hintMode) {
      // Если уже в режиме подсказки, отменяем его
      cancelHintSelection();
      return;
    }

    const wordLength = currentGame === 0 ? 3 : currentGame === 1 ? 4 : 5;

    // Находим все плитки, которые можно использовать для подсказки
    const availableTiles = [];
    for (let i = 0; i < letters.length; i++) {
      if (!fixedIndices.includes(i)) {
        availableTiles.push(i);
      }
    }

    if (availableTiles.length === 0) {
      messageEl.textContent = "Все буквы уже на своих местах!";
      messageEl.style.color = "var(--message-success)";
      return;
    }

    // Включаем режим выбора подсказки
    hintMode = true;
    messageEl.textContent =
      "Выберите плитку для подсказки (или нажмите Подсказку снова для отмены)";
    messageEl.style.color = "var(--message-hint)";

    // Подсвечиваем доступные плитки
    const tiles = document.querySelectorAll(".tile");
    highlightedTiles = [];

    availableTiles.forEach((index) => {
      if (!fixedIndices.includes(index)) {
        tiles[index].classList.add("hint-available");
        highlightedTiles.push(index);
      }
    });
  }

  function handleHintSelection(index) {
    if (!hintMode || fixedIndices.includes(index)) return;

    const correctLetter = initialLetters[index];
    const tiles = document.querySelectorAll(".tile");

    // Находим текущую позицию правильной буквы
    let currentPos = -1;
    for (let i = 0; i < letters.length; i++) {
      if (letters[i] === correctLetter && !fixedIndices.includes(i)) {
        currentPos = i;
        break;
      }
    }

    // Если буква уже на своем месте
    if (currentPos === index) {
      letters[index] = correctLetter;
      fixedIndices.push(index);
      hintsUsed++;
      cancelHintSelection();
      renderBoard();
      checkSolution();
      return;
    }

    // Если буква не найдена среди нефиксированных (уже все зафиксированы)
    if (currentPos === -1) {
      messageEl.textContent = "Все буквы уже на своих местах!";
      messageEl.style.color = "var(--message-success)";
      cancelHintSelection();
      return;
    }

    // Воспроизводим звук перемещения
    moveSound.currentTime = 0;
    moveSound.play();

    // Анимация перемещения
    const tile1 = tiles[currentPos];
    const tile2 = tiles[index];

    tile1.classList.add("swap");
    tile2.classList.add("swap");

    // Получаем позиции плиток
    const rect1 = tile1.getBoundingClientRect();
    const rect2 = tile2.getBoundingClientRect();

    // Рассчитываем смещение
    const dx = rect2.left - rect1.left;
    const dy = rect2.top - rect1.top;

    // Применяем смещение
    tile1.style.transform = `translate(${dx}px, ${dy}px)`;
    tile2.style.transform = `translate(${-dx}px, ${-dy}px)`;

    // Меняем буквы местами в массиве
    [letters[currentPos], letters[index]] = [
      letters[index],
      letters[currentPos],
    ];

    // Фиксируем плитку
    fixedIndices.push(index);
    hintsUsed++;

    // Перерисовываем доску после завершения анимации
    setTimeout(() => {
      tile1.style.transform = "";
      tile2.style.transform = "";
      cancelHintSelection();
      renderBoard();
      checkSolution();
    }, 500);
  }

  function cancelHintSelection() {
    hintMode = false;
    const tiles = document.querySelectorAll(".tile");

    highlightedTiles.forEach((index) => {
      tiles[index].classList.remove("hint-available");
    });

    highlightedTiles = [];
    messageEl.textContent = "";
  }

  // Сброс игры
  function resetGame() {
    const wordCount = currentGame === 0 ? 3 : currentGame === 1 ? 4 : 5;
    const wordLength = currentGame === 0 ? 3 : currentGame === 1 ? 4 : 5;
    hintMode = false;
    highlightedTiles = [];

    // Выбираем новые случайные слова
    currentWords = selectRandomWords(
      wordsDictionaries[currentGame].wordsToGuess,
      wordCount
    );

    initialLetters = currentWords.join("").split("");
    letters = [...initialLetters];
    fixedIndices = [];
    isSolved = false;

    // Фиксируем некоторые буквы в зависимости от режима
    if (currentGame === 1) {
      for (let i = 0; i < wordCount; i++) {
        fixedIndices.push(i * wordLength);
      }
    } else if (currentGame === 2) {
      for (let i = 0; i < wordCount; i++) {
        fixedIndices.push(i * wordLength);
        fixedIndices.push(i * wordLength + 1);
      }
    }

    selectedTileIndex = null;
    messageEl.textContent = "";
    startTime = new Date();
    endTime = null;
    hintsUsed = 0;

    // Скрываем кнопку "Поделиться"
    document.getElementById("share-btn").style.display = "none";

    if (playAgainBtn) {
      document.querySelector(".controls").removeChild(playAgainBtn);
      playAgainBtn = null;
    }

    shuffleTiles(true);
  }

  // Перемешать плитки
  function shuffleTiles(silent = false) {
    if (selectedTileIndex !== null) {
      document
        .querySelector(`.tile[data-index="${selectedTileIndex}"]`)
        .classList.remove("selected");
      selectedTileIndex = null;
    }

    let shuffleIndices = [];
    for (let i = 0; i < letters.length; i++) {
      if (!fixedIndices.includes(i)) {
        shuffleIndices.push(i);
      }
    }

    for (let i = shuffleIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const a = shuffleIndices[i];
      const b = shuffleIndices[j];
      [letters[a], letters[b]] = [letters[b], letters[a]];
    }

    renderBoard();
  }

  // Запуск игры
  initGame();
});
