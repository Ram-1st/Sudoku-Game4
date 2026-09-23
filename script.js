// DOM Elements
const screens = {
  menu: document.getElementById('menu'),
  game: document.getElementById('game'),
  wellDone: document.getElementById('well-done')
};
const illustration = document.querySelector('.illustration-container');
const sudokuTable = document.getElementById('sudoku-table');
const cells = sudokuTable.getElementsByTagName('td');
const numberButtons = document.querySelectorAll('#number-buttons button[data-number]');
const deleteButton = document.getElementById('delete-cell-button');
const tryAgainBtn = document.getElementById('try-again-button');
const gameBackBtn = document.getElementById('game-back-button');
const playAgainBtn = document.getElementById('play-again-button');
const backMenuBtn = document.getElementById('back-menu-button');
const languageBtn = document.getElementById('language-button');

// Game State
let currentDifficulty = 'easy';
let solutionGrid = [];
let initialGrid = [];
let playerGrid = [];
let selectedCell = null; 
let currentLang = 'en';

// --- 1. LANGUAGE (EN/NL) SYSTEM ---
const i18n = {
  en: {
    appTitle: "Sudoku",
    btnEasy: "Easy",
    btnMedium: "Medium",
    btnHard: "Hard",
    btnTryAgain: "Try again",
    btnGameBack: "Back to menu",
    wellDoneTitle: "Well done!",
    wellDoneSub1: "You solved the Sudoku!",
    wellDoneSub2: "Great job! Want to play again?",
    btnPlayAgain: "Play again",
    btnBackMenu: "Back to menu",
    confirmPrompt: "Restart puzzle?\nYour current progress will be lost."
  },
  nl: {
    appTitle: "Sudoku",
    btnEasy: "Makkelijk",
    btnMedium: "Gemiddeld",
    btnHard: "Moeilijk",
    btnTryAgain: "Opnieuw",
    btnGameBack: "Terug naar menu",
    wellDoneTitle: "Goed gedaan!",
    wellDoneSub1: "Je hebt de Sudoku opgelost!",
    wellDoneSub2: "Goed werk! Nog een keer spelen?",
    btnPlayAgain: "Nog een keer",
    btnBackMenu: "Terug naar menu",
    confirmPrompt: "Puzzel opnieuw starten?\nJe huidige voortgang gaat verloren."
  }
};

function toggleLanguage() {
  currentLang = currentLang === 'en' ? 'nl' : 'en';
  
  if (currentLang === 'nl') {
    languageBtn.classList.add('active');
  } else {
    languageBtn.classList.remove('active');
  }
  
  updateLanguageUI();
}

function updateLanguageUI() {
  const text = i18n[currentLang];
  
  document.querySelector('#menu h1').textContent = text.appTitle;
  document.querySelector('#game h2').textContent = text.appTitle;
  
  document.getElementById('easy-button').textContent = text.btnEasy;
  document.getElementById('medium-button').textContent = text.btnMedium;
  document.getElementById('hard-button').textContent = text.btnHard;
  
  document.getElementById('try-again-button').textContent = text.btnTryAgain;
  if (gameBackBtn) gameBackBtn.textContent = text.btnGameBack;
  
  document.querySelector('#well-done h2').textContent = text.wellDoneTitle;
  const wellDoneElements = document.querySelectorAll('#well-done p');
  if (wellDoneElements.length >= 2) {
    wellDoneElements[0].textContent = text.wellDoneSub1;
    wellDoneElements[1].textContent = text.wellDoneSub2;
  }
  
  document.getElementById('play-again-button').textContent = text.btnPlayAgain;
  document.getElementById('back-menu-button').textContent = text.btnBackMenu;
}

// --- 2. SUDOKU GENERATOR (real random generation via backtracking) ---
//
// Instead of reshuffling one memorized grid, this builds a brand new,
// randomly-filled valid solution from an empty board every time, then
// removes numbers one at a time -- but only keeps a removal if the
// puzzle still has exactly ONE possible solution. That means cells can
// genuinely have more than one number that doesn't break any Sudoku
// rule yet, until you narrow it down through logic.

function createEmptyGrid() {
  return Array.from({ length: 9 }, () => Array(9).fill(0));
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function findEmptyCell(grid) {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] === 0) return [r, c];
    }
  }
  return null;
}

// Fills an empty grid completely with a valid, randomly generated solution.
function fillGrid(grid) {
  const empty = findEmptyCell(grid);
  if (!empty) return true; // no empty cells left = solved

  const [r, c] = empty;
  const candidates = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);

  for (const num of candidates) {
    if (isValidMove(grid, r, c, num)) {
      grid[r][c] = num;
      if (fillGrid(grid)) return true;
      grid[r][c] = 0; // backtrack: undo and try the next candidate
    }
  }
  return false;
}

// Counts how many solutions a grid has, stopping early once it reaches `limit`.
// We only ever need to know "is it 1, or more than 1?", so limit defaults to 2.
function countSolutions(grid, limit = 2) {
  let count = 0;

  function solve() {
    if (count >= limit) return;
    const empty = findEmptyCell(grid);
    if (!empty) {
      count++;
      return;
    }
    const [r, c] = empty;
    for (let num = 1; num <= 9; num++) {
      if (count >= limit) return;
      if (isValidMove(grid, r, c, num)) {
        grid[r][c] = num;
        solve();
        grid[r][c] = 0;
      }
    }
  }

  solve();
  return count;
}

// Tries to remove `targetRemovals` numbers from a fully solved grid, in random
// order, one at a time -- only keeping a removal if the puzzle still solves
// in exactly one way. If it can't safely reach the target, it stops early
// rather than creating a puzzle with more than one valid solution.
function removeCells(grid, targetRemovals) {
  const positions = shuffle(
    Array.from({ length: 81 }, (_, i) => [Math.floor(i / 9), i % 9])
  );

  let removed = 0;

  for (const [r, c] of positions) {
    if (removed >= targetRemovals) break;

    const backup = grid[r][c];
    grid[r][c] = 0;

    const gridCopy = JSON.parse(JSON.stringify(grid));
    const solutions = countSolutions(gridCopy, 2);

    if (solutions === 1) {
      removed++;
    } else {
      grid[r][c] = backup; // removing this one breaks uniqueness -- put it back
    }
  }

  return grid;
}

function generatePuzzle(difficulty) {
  const freshGrid = createEmptyGrid();
  fillGrid(freshGrid);
  solutionGrid = JSON.parse(JSON.stringify(freshGrid));

  const cellsToRemove = difficulty === 'easy' ? 30 : difficulty === 'medium' ? 45 : 55;
  initialGrid = removeCells(JSON.parse(JSON.stringify(freshGrid)), cellsToRemove);

  playerGrid = JSON.parse(JSON.stringify(initialGrid));
}

// --- 3. GAMEPLAY & LOGIC ---
function renderBoard() {
  let cellIndex = 0;
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const td = cells[cellIndex];
      td.dataset.row = r;
      td.dataset.col = c;
      td.className = ''; 
      
      const val = playerGrid[r][c];
      if (val !== 0) {
        td.textContent = val;
        if (initialGrid[r][c] !== 0) {
          td.style.fontWeight = 'bold';
          td.style.color = '#1f2937'; // Black for original numbers
        } else {
          td.style.fontWeight = 'normal';
          td.style.color = '#1f2937'; // Black for player numbers
        }
      } else {
        td.textContent = '';
      }
      cellIndex++;
    }
  }
}

function showScreen(screenName) {
  screens.menu.style.display = 'none';
  screens.game.style.display = 'none';
  screens.wellDone.style.display = 'none';
  illustration.style.display = 'none'; 

  if (screenName === 'menu') screens.menu.style.display = 'block';
  if (screenName === 'game') screens.game.style.display = 'block';
  if (screenName === 'well-done') {
    screens.wellDone.style.display = 'block';
    illustration.style.display = 'flex'; 
  }
}

function startGame(difficulty) {
  currentDifficulty = difficulty;
  generatePuzzle(difficulty);
  renderBoard();
  selectedCell = null;
  showScreen('game');
}

function handleCellClick(e) {
  const td = e.target;
  if (selectedCell) selectedCell.domElement.classList.remove('selected');
  td.classList.add('selected');
  selectedCell = { row: parseInt(td.dataset.row), col: parseInt(td.dataset.col), domElement: td };
}

function isValidMove(grid, r, c, num) {
  for (let i = 0; i < 9; i++) {
    if (i !== c && grid[r][i] === num) return false; 
    if (i !== r && grid[i][c] === num) return false; 
  }
  let startRow = Math.floor(r / 3) * 3;
  let startCol = Math.floor(c / 3) * 3;
  for (let i = startRow; i < startRow + 3; i++) {
    for (let j = startCol; j < startCol + 3; j++) {
      if ((i !== r || j !== c) && grid[i][j] === num) return false; 
    }
  }
  return true;
}

function checkBoardState() {
  let isBoardFilled = true;
  let hasConflicts = false;

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const td = cells[r * 9 + c];
      const val = playerGrid[r][c];

      if (val === 0) {
        isBoardFilled = false;
        td.classList.remove('wrong');
        continue;
      }

      if (initialGrid[r][c] !== 0) continue; 

      if (!isValidMove(playerGrid, r, c, val)) {
        td.classList.add('wrong');
        hasConflicts = true;
      } else {
        td.classList.remove('wrong');
      }
    }
  }

  if (isBoardFilled && !hasConflicts) {
    let won = true;
    for(let r=0; r<9; r++){
      for(let c=0; c<9; c++){
        if(playerGrid[r][c] !== solutionGrid[r][c]) won = false;
      }
    }
    if (won) setTimeout(() => showScreen('well-done'), 300);
  }
}

function handleNumberInput(num) {
  if (!selectedCell) return; 
  const { row, col, domElement } = selectedCell;
  if (initialGrid[row][col] !== 0) return; 

  playerGrid[row][col] = num;
  domElement.textContent = num;
  domElement.style.color = '#1f2937'; // Black text when typed
  
  checkBoardState();

  // If this number breaks a Sudoku rule, show it as wrong briefly,
  // then automatically clear it after a short delay.
  if (!isValidMove(playerGrid, row, col, num)) {
    setTimeout(() => {
      // Only clear if the cell still holds this same wrong number --
      // the player may have already changed or deleted it themselves.
      if (playerGrid[row][col] === num) {
        playerGrid[row][col] = 0;
        domElement.textContent = '';
        domElement.classList.remove('wrong');
        checkBoardState();
      }
    }, 1000);
  }
}

function handleDelete() {
  if (!selectedCell) return;
  const { row, col, domElement } = selectedCell;
  if (initialGrid[row][col] !== 0) return;

  playerGrid[row][col] = 0;
  domElement.textContent = '';
  checkBoardState();
}

// --- 4. EVENT LISTENERS ---
languageBtn.addEventListener('click', toggleLanguage);
document.getElementById('easy-button').addEventListener('click', () => startGame('easy'));
document.getElementById('medium-button').addEventListener('click', () => startGame('medium'));
document.getElementById('hard-button').addEventListener('click', () => startGame('hard'));

for (let td of cells) td.addEventListener('click', handleCellClick);

numberButtons.forEach(btn => {
  btn.addEventListener('click', (e) => handleNumberInput(parseInt(e.target.dataset.number)));
});

deleteButton.addEventListener('click', handleDelete);

tryAgainBtn.addEventListener('click', () => {
  if (window.confirm(i18n[currentLang].confirmPrompt)) {
    startGame(currentDifficulty); 
  }
});

if (gameBackBtn) {
  gameBackBtn.addEventListener('click', () => {
    if (window.confirm(i18n[currentLang].confirmPrompt)) {
      showScreen('menu');
    }
  });
}

playAgainBtn.addEventListener('click', () => startGame(currentDifficulty));
backMenuBtn.addEventListener('click', () => showScreen('menu'));

// Secret Developer Trigger: Tap "Sudoku" 5 times on either screen
let tapCount = 0;
let tapResetTimer = null;

const headersToTap = document.querySelectorAll('#menu h1, #game h2');

headersToTap.forEach(header => {
  header.style.cursor = 'pointer'; 
  
  header.addEventListener('click', () => {
    tapCount++;
    clearTimeout(tapResetTimer);

    if (tapCount >= 5) {
      showScreen('well-done');
      tapCount = 0;
    }

    tapResetTimer = setTimeout(() => { tapCount = 0; }, 1500);
  });
});

// --- INITIALIZE ---
updateLanguageUI();
showScreen('menu');
