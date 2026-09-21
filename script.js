// ==========================================
// DOM ELEMENTS
// ==========================================

const screens = {
  menu: document.getElementById("menu"),
  game: document.getElementById("game"),
  wellDone: document.getElementById("well-done")
};

const sudokuTable = document.getElementById("sudoku-table");
const cells = sudokuTable.querySelectorAll("td");

const languageBtn =
  document.getElementById("language-button");

const easyButton =
  document.getElementById("easy-button");

const mediumButton =
  document.getElementById("medium-button");

const hardButton =
  document.getElementById("hard-button");

const numberButtons =
  document.querySelectorAll(
    "#number-buttons button[data-number]"
  );

const deleteButton =
  document.getElementById("delete-cell-button");

const tryAgainBtn =
  document.getElementById("try-again-button");

const gameBackBtn =
  document.getElementById("game-back-button");

const playAgainBtn =
  document.getElementById("play-again-button");

const backMenuBtn =
  document.getElementById("back-menu-button");

const menuTitle =
  document.getElementById("menu-title");


// ==========================================
// GAME VARIABLES
// ==========================================

let currentDifficulty = "easy";

let solutionGrid = [];
let initialGrid = [];
let playerGrid = [];

let selectedRow = null;
let selectedCol = null;

let currentLang = "en";


// ==========================================
// LANGUAGE
// ==========================================

const i18n = {

  en: {
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",

    tryAgain: "Try again",
    backMenu: "Back to menu",

    wellDone: "Well Done!",
    solved: "You solved the Sudoku!",
    again: "Great job! Want to play again?",

    playAgain: "Play again",

    confirm:
      "Restart puzzle?\nYour current progress will be lost."
  },

  nl: {
    easy: "Makkelijk",
    medium: "Gemiddeld",
    hard: "Moeilijk",

    tryAgain: "Opnieuw",
    backMenu: "Terug naar menu",

    wellDone: "Goed gedaan!",
    solved: "Je hebt de Sudoku opgelost!",
    again: "Goed gedaan! Nog een keer spelen?",

    playAgain: "Nog een keer",

    confirm:
      "Puzzel opnieuw starten?\nJe huidige voortgang gaat verloren."
  }

};


function updateLanguageUI() {

  const text = i18n[currentLang];

  easyButton.textContent = text.easy;
  mediumButton.textContent = text.medium;
  hardButton.textContent = text.hard;

  tryAgainBtn.textContent = text.tryAgain;

  gameBackBtn.textContent = text.backMenu;

  document.querySelector("#well-done h2")
    .textContent = text.wellDone;

  const paragraphs =
    document.querySelectorAll("#well-done p");

  paragraphs[0].textContent = text.solved;
  paragraphs[1].textContent = text.again;

  playAgainBtn.textContent = text.playAgain;

  backMenuBtn.textContent = text.backMenu;
}


languageBtn.addEventListener("click", function () {

  currentLang =
    currentLang === "en" ? "nl" : "en";

  languageBtn.classList.toggle(
    "active",
    currentLang === "nl"
  );

  updateLanguageUI();

});


// ==========================================
// CREATE BOARD
// ==========================================

function createEmptyBoard() {

  return Array.from(
    { length: 9 },
    () => Array(9).fill(0)
  );

}


// ==========================================
// SHUFFLE
// ==========================================

function shuffle(array) {

  const result = [...array];

  for (
    let i = result.length - 1;
    i > 0;
    i--
  ) {

    const j =
      Math.floor(Math.random() * (i + 1));

    [
      result[i],
      result[j]
    ] = [
      result[j],
      result[i]
    ];

  }

  return result;

}


// ==========================================
// CHECK NUMBER
// ==========================================

function isSafe(board, row, col, number) {

  for (let c = 0; c < 9; c++) {

    if (board[row][c] === number) {
      return false;
    }

  }


  for (let r = 0; r < 9; r++) {

    if (board[r][col] === number) {
      return false;
    }

  }


  const startRow =
    Math.floor(row / 3) * 3;

  const startCol =
    Math.floor(col / 3) * 3;


  for (
    let r = startRow;
    r < startRow + 3;
    r++
  ) {

    for (
      let c = startCol;
      c < startCol + 3;
      c++
    ) {

      if (board[r][c] === number) {
        return false;
      }

    }

  }

  return true;

}


// ==========================================
// GENERATE SOLUTION
// ==========================================

function fillBoard(board) {

  for (let row = 0; row < 9; row++) {

    for (let col = 0; col < 9; col++) {

      if (board[row][col] !== 0) {
        continue;
      }


      const numbers = shuffle([
        1, 2, 3,
        4, 5, 6,
        7, 8, 9
      ]);


      for (const number of numbers) {

        if (
          isSafe(
            board,
            row,
            col,
            number
          )
        ) {

          board[row][col] = number;


          if (fillBoard(board)) {
            return true;
          }


          board[row][col] = 0;

        }

      }

      return false;

    }

  }

  return true;

}


// ==========================================
// GENERATE PUZZLE
// ==========================================

function generatePuzzle(difficulty) {

  solutionGrid =
    createEmptyBoard();

  fillBoard(solutionGrid);


  initialGrid =
    solutionGrid.map(row => [...row]);


  const clues = {

    easy: 42,
    medium: 34,
    hard: 28

  };


  const cellsToRemove =
    81 - clues[difficulty];


  const positions =
    shuffle(
      Array.from(
        { length: 81 },
        (_, index) => index
      )
    );


  for (
    let i = 0;
    i < cellsToRemove;
    i++
  ) {

    const position =
      positions[i];

    const row =
      Math.floor(position / 9);

    const col =
      position % 9;

    initialGrid[row][col] = 0;

  }


  playerGrid =
    initialGrid.map(row => [...row]);

}


// ==========================================
// DRAW BOARD
// ==========================================

function renderBoard() {

  cells.forEach((cell, index) => {

    const row =
      Math.floor(index / 9);

    const col =
      index % 9;


    cell.dataset.row = row;
    cell.dataset.col = col;


    cell.classList.remove(
      "selected",
      "wrong"
    );


    const value =
      playerGrid[row][col];


    if (value !== 0) {

      cell.textContent = value;

      if (initialGrid[row][col] !== 0) {
        cell.style.fontWeight = "bold";
      } else {
        cell.style.fontWeight = "normal";
      }

    } else {

      cell.textContent = "";
      cell.style.fontWeight = "normal";

    }


    if (
      row === selectedRow &&
      col === selectedCol
    ) {

      cell.classList.add("selected");

    }

  });

}


// ==========================================
// SCREEN CONTROL
// ==========================================

function showScreen(screenName) {

  screens.menu.style.display = "none";
  screens.game.style.display = "none";
  screens.wellDone.style.display = "none";


  if (screenName === "menu") {
    screens.menu.style.display = "block";
  }


  if (screenName === "game") {
    screens.game.style.display = "block";
  }


  if (screenName === "well-done") {
    screens.wellDone.style.display = "block";
  }

}


// ==========================================
// START GAME
// ==========================================

function startGame(difficulty) {

  currentDifficulty = difficulty;

  generatePuzzle(difficulty);

  selectedRow = null;
  selectedCol = null;

  renderBoard();

  showScreen("game");

}


// ==========================================
// SELECT CELL
// ==========================================

cells.forEach(cell => {

  cell.addEventListener(
    "click",
    function () {

      selectedRow =
        Number(cell.dataset.row);

      selectedCol =
        Number(cell.dataset.col);

      renderBoard();

    }
  );

});


// ==========================================
// ENTER NUMBER
// ==========================================

function handleNumberInput(number) {

  if (
    selectedRow === null ||
    selectedCol === null
  ) {
    return;
  }


  if (
    initialGrid[selectedRow][selectedCol] !== 0
  ) {
    return;
  }


  const row = selectedRow;
  const col = selectedCol;

  const cell =
    cells[row * 9 + col];


  // CORRECT
  if (
    number === solutionGrid[row][col]
  ) {

    playerGrid[row][col] = number;

    renderBoard();

    checkComplete();

    return;

  }


  // WRONG
  cell.textContent = number;

  cell.classList.remove("selected");
  cell.classList.add("wrong");


  setTimeout(function () {

    if (
      playerGrid[row][col] === 0
    ) {
      cell.textContent = "";
    }


    cell.classList.remove("wrong");


    if (
      selectedRow === row &&
      selectedCol === col
    ) {

      cell.classList.add("selected");

    }

  }, 600);

}


// Number buttons

numberButtons.forEach(button => {

  button.addEventListener(
    "click",
    function () {

      const number =
        Number(button.dataset.number);

      handleNumberInput(number);

    }
  );

});


// ==========================================
// DELETE
// ==========================================

deleteButton.addEventListener(
  "click",
  function () {

    if (
      selectedRow === null ||
      selectedCol === null
    ) {
      return;
    }


    if (
      initialGrid[selectedRow][selectedCol] !== 0
    ) {
      return;
    }


    playerGrid[selectedRow][selectedCol] = 0;

    renderBoard();

  }
);


// ==========================================
// CHECK COMPLETE
// ==========================================

function checkComplete() {

  for (let row = 0; row < 9; row++) {

    for (let col = 0; col < 9; col++) {

      if (
        playerGrid[row][col] !==
        solutionGrid[row][col]
      ) {

        return;

      }

    }

  }


  setTimeout(function () {

    selectedRow = null;
    selectedCol = null;

    showScreen("well-done");

  }, 300);

}


// ==========================================
// TRY AGAIN
// ==========================================

tryAgainBtn.addEventListener(
  "click",
  function () {

    if (
      window.confirm(
        i18n[currentLang].confirm
      )
    ) {

      startGame(currentDifficulty);

    }

  }
);


// ==========================================
// BACK TO MENU
// ==========================================

gameBackBtn.addEventListener(
  "click",
  function () {

    if (
      window.confirm(
        i18n[currentLang].confirm
      )
    ) {

      selectedRow = null;
      selectedCol = null;

      showScreen("menu");

    }

  }
);


// ==========================================
// PLAY AGAIN
// ==========================================

playAgainBtn.addEventListener(
  "click",
  function () {

    startGame(currentDifficulty);

  }
);


// ==========================================
// WELL DONE → MENU
// ==========================================

backMenuBtn.addEventListener(
  "click",
  function () {

    selectedRow = null;
    selectedCol = null;

    showScreen("menu");

  }
);


// ==========================================
// DIFFICULTY
// ==========================================

easyButton.addEventListener(
  "click",
  function () {

    startGame("easy");

  }
);


mediumButton.addEventListener(
  "click",
  function () {

    startGame("medium");

  }
);


hardButton.addEventListener(
  "click",
  function () {

    startGame("hard");

  }
);


// ==========================================
// SUDOKU TITLE SECRET SHORTCUT
// 5 CLICKS → WELL DONE
// ==========================================

let titleClicks = 0;
let titleTimer;


menuTitle.addEventListener(
  "click",
  function () {

    titleClicks++;

    clearTimeout(titleTimer);


    titleTimer = setTimeout(
      function () {

        titleClicks = 0;

      },
      1000
    );


    if (titleClicks === 5) {

      titleClicks = 0;

      showScreen("well-done");

    }

  }
);


// ==========================================
// START
// ==========================================

updateLanguageUI();

showScreen("menu");
