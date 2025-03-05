const menu = document.getElementById('menu');
const gameContainer = document.getElementById('game-container');
const pieceContainer = document.getElementById('piece-container');
const controls = document.getElementById('controls');
const scoreElement = document.getElementById('score');
const gameOverElement = document.getElementById('game-over');

const ROWS = 10;
const COLS = 10;
let board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
let score = 0;

let selectedPiece = null;
let lastPiece = null;

function startGame() {
    menu.style.display = 'none';
    gameContainer.style.display = 'grid';
    pieceContainer.style.display = 'flex';
    controls.style.display = 'block';
    gameOverElement.style.display = 'none';
    restartGame();
}

function showInstructions() {
    alert('Drag and drop the pieces onto the board to fill rows or columns. Clear as many lines as you can!');
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
}

function createGameBoard() {
    gameContainer.innerHTML = '';
    board.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
            const cellElement = document.createElement('div');
            cellElement.classList.add('cell');
            if (cell === 1) {
                cellElement.classList.add('filled');
            }
            cellElement.dataset.row = rowIndex;
            cellElement.dataset.col = colIndex;
            gameContainer.appendChild(cellElement);
        });
    });
}

function generateRandomPiece() {
    const pieces = [
        [[1, 1, 1, 1]], // Line
        [[1, 1], [1, 1]], // Square
        [[1, 0, 0], [1, 1, 1]], // L-shape
        [[0, 1, 1], [1, 1, 0]], // Z-shape
        [[1, 1, 1], [0, 1, 0]], // T-shape
        [[1, 1, 1], [1, 0, 0]], // Reverse L-shape
        [[0, 0, 1], [1, 1, 1]], // Reverse Z-shape
        [[1, 1, 0], [0, 1, 1]], // S-shape
        [[1, 1, 1], [1, 0, 0], [1, 0, 0]], // Larger L-shape
        [[1, 1, 1, 1, 1]], // Long line
        [[1, 1, 1], [1, 1, 0]], // T with extra block
        [[1, 1, 0], [0, 1, 1], [0, 0, 1]], // S with extra block
    ];
    let newPiece;
    do {
        newPiece = pieces[Math.floor(Math.random() * pieces.length)];
    } while (JSON.stringify(newPiece) === JSON.stringify(lastPiece));
    lastPiece = newPiece;
    return newPiece;
}

function createPiece() {
    pieceContainer.innerHTML = '';
    const pieceData = generateRandomPiece();
    const pieceElement = document.createElement('div');
    pieceElement.classList.add('piece');

    pieceData.forEach(row => {
        row.forEach(cell => {
            const pieceCell = document.createElement('div');
            pieceCell.classList.add('piece-cell');
            if (cell === 0) {
                pieceCell.classList.add('empty');
            }
            pieceElement.appendChild(pieceCell);
        });
    });

    pieceElement.dataset.piece = JSON.stringify(pieceData);
    pieceElement.draggable = true;

    pieceElement.addEventListener('dragstart', (e) => {
        selectedPiece = pieceData;
        e.dataTransfer.setData('text/plain', JSON.stringify(pieceData));
    });

    pieceContainer.appendChild(pieceElement);
}

function setupDragAndDrop() {
    gameContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
        const targetCell = e.target;
        if (targetCell.classList.contains('cell')) {
            clearHighlights();
            highlightPlacement(targetCell);
        }
    });

    gameContainer.addEventListener('dragleave', (e) => {
        clearHighlights();
    });

    gameContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        const pieceData = JSON.parse(e.dataTransfer.getData('text/plain'));
        const targetCell = e.target;

        if (targetCell.classList.contains('cell')) {
            const row = parseInt(targetCell.dataset.row);
            const col = parseInt(targetCell.dataset.col);

            if (canPlacePiece(pieceData, row, col)) {
                placePiece(pieceData, row, col);
                clearCompletedLines();
                createPiece();

                if (!hasValidMoves()) {
                    gameOver();
                }
            } else {
                alert("Invalid placement!");
            }
        }
        clearHighlights();
    });
}

function clearHighlights() {
    document.querySelectorAll('.cell.highlight').forEach(cell => {
        cell.classList.remove('highlight');
    });
}

function highlightPlacement(targetCell) {
    const row = parseInt(targetCell.dataset.row);
    const col = parseInt(targetCell.dataset.col);

    for (let r = 0; r < selectedPiece.length; r++) {
        for (let c = 0; c < selectedPiece[r].length; c++) {
            if (selectedPiece[r][c] === 1) {
                const boardRow = row + r;
                const boardCol = col + c;

                if (boardRow < ROWS && boardCol < COLS) {
                    const cellToHighlight = document.querySelector(`.cell[data-row="${boardRow}"][data-col="${boardCol}"]`);
                    if (cellToHighlight) {
                        cellToHighlight.classList.add('highlight');
                    }
                }
            }
        }
    }
}

function canPlacePiece(pieceData, row, col) {
    for (let r = 0; r < pieceData.length; r++) {
        for (let c = 0; c < pieceData[r].length; c++) {
            if (pieceData[r][c] === 1) {
                const boardRow = row + r;
                const boardCol = col + c;

                if (
                    boardRow >= ROWS || 
                    boardCol >= COLS || 
                    boardRow < 0 || 
                    boardCol < 0 || 
                    board[boardRow][boardCol] === 1
                ) {
                    return false;
                }
            }
        }
    }
    return true;
}

function placePiece(pieceData, row, col) {
    for (let r = 0; r < pieceData.length; r++) {
        for (let c = 0; c < pieceData[r].length; c++) {
            if (pieceData[r][c] === 1) {
                const cell = document.querySelector(`.cell[data-row="${row + r}"][data-col="${col + c}"]`);
                cell.classList.add('filled');
                board[row + r][col + c] = 1;
            }
        }
    }
    createGameBoard();
}

function clearCompletedLines() {
    let linesCleared = 0;
    
    // Check for completed rows
    for (let row = 0; row < ROWS; row++) {
        if (board[row].every(cell => cell === 1)) {
            board[row].fill(0);
            linesCleared++;
        }
    }

    // Check for completed columns
    for (let col = 0; col < COLS; col++) {
        if (board.every(row => row[col] === 1)) {
            for (let row = 0; row < ROWS; row++) {
                board[row][col] = 0;
            }
            linesCleared++;
        }
    }

    if (linesCleared > 0) {
        updateScore(linesCleared);
        createGameBoard();
    }
}

function updateScore(linesCleared) {
    const points = linesCleared * 100;
    score += points;
    scoreElement.textContent = score;
}

function hasValidMoves() {
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (canPlacePiece(selectedPiece, row, col)) {
                return true;
            }
        }
    }
    return false;
}

function gameOver() {
    gameContainer.style.display = 'none';
    pieceContainer.style.display = 'none';
    controls.style.display = 'none';
    gameOverElement.style.display = 'block';
}

function restartGame() {
    board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    score = 0;
    scoreElement.textContent = score;
    gameContainer.style.display = 'grid';
    pieceContainer.style.display = 'flex';
    controls.style.display = 'block';
    gameOverElement.style.display = 'none';
    createGameBoard();
    createPiece();
}

createGameBoard();
createPiece();
setupDragAndDrop();