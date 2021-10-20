var updateBoard, updateScore, updateHighScore;
var disablePrevBtn, enablePrevBtn;
var disableResetBtn, enableResetBtn;
var animateSlide;
var resolving = false;
var boardSize = 4;
var BOARD,
	SCORE = 0;
var PREV_STATE = {};
var DIALOG, RESET;

const reRender = function (state) {
	let { newBoard, score, win } = state;
	updateBoard(BOARD, newBoard);
	SCORE += score;
	updateScore(SCORE);
	if (SCORE > getHighScore()) updateHighScore(SCORE);
	enablePrevBtn();
	enableResetBtn();
	if (win) {
		RESET = resetBoard('win');
		RESET.next();
	}
};

const checkGameOver = function (board) {
	let directions = ['up', 'right', 'down', 'left'];
	let boardString = JSON.stringify(board);
	for (i = 0; i < 4; i++) {
		let dir = directions[i];
		let { newBoard } = resolveBoard(board, dir);
		if (boardString != JSON.stringify(newBoard)) {
			resolving = false;
			return;
		}
	}
	RESET = resetBoard('gameover');
	RESET.next();
	resolving = false;
};

const updateState = function (newState) {
	PREV_STATE = { board: cloneBoard(BOARD), score: SCORE };
	animateSlide(newState);
};

const handleKeydown = function (e) {
	if (resolving) return;
	resolving = true;
	let direction = getDirection(e.key);
	if (direction == 'invalid') {
		resolving = false;
		return;
	}
	let newState = resolveBoard(BOARD, direction);
	if (JSON.stringify(BOARD) == JSON.stringify(newState.newBoard)) {
		resolving = false;
		return;
	}
	newState.newBoard = addNewNumber(newState.newBoard);
	updateState(newState);
	e.stopPropagation();
};

const getSwipeDirection = function (xCoords, yCoords) {
	let xSwipe = xCoords[0] - yCoords[0];
	let ySwipe = xCoords[1] - yCoords[1];
	if (xSwipe == 0 && ySwipe == 0) return 'invalid';
	let swipe =
		Math.abs(xSwipe) > Math.abs(ySwipe)
			? {
					value: xSwipe,
					axis: ['left', 'right'],
			  }
			: {
					value: ySwipe,
					axis: ['up', 'down'],
			  };
	let direction = swipe.value > 0 ? swipe.axis[0] : swipe.axis[1];
	return direction;
};

const handleSwipe = (function () {
	let xCoords = [],
		yCoords = [];
	return function (e) {
		if (resolving) return;
		if (xCoords.length == 0) {
			xCoords.push(e.changedTouches[0].pageX);
			xCoords.push(e.changedTouches[0].pageY);
		} else {
			resolving = true;
			yCoords.push(e.changedTouches[0].pageX);
			yCoords.push(e.changedTouches[0].pageY);
			let direction = getSwipeDirection(xCoords, yCoords);
			if (direction == 'invalid') {
				resolving = false;
				xCoords = [];
				yCoords = [];
				return;
			}
			let newState = resolveBoard(BOARD, direction);
			if (JSON.stringify(BOARD) == JSON.stringify(newState.newBoard)) {
				resolving = false;
				xCoords = [];
				yCoords = [];
				return;
			}
			newState.newBoard = addNewNumber(newState.newBoard);
			updateState(newState);
			// necessary before exit
			xCoords = [];
			yCoords = [];
		}
	};
})();

const getHighScore = (function () {
	let highScore = localStorage.getItem('highScore');
	if (highScore === null) localStorage.setItem('highScore', 0);
	return function () {
		let score = localStorage.getItem('highScore');
		return Number(score);
	};
})();

const resetBoard = function* (type) {
	resolving = true;
	let button2,
		button1 = document.createElement('button');
	let message = document.getElementsByClassName('message')[0];
	let handleContinue = _ => {
		RESET.next();
		DIALOG.classList.remove('open');
	};
	button1.classList.add('continue');
	if (type == 'gameover') {
		message.textContent = 'Game Over, no moves left';
		button1.textContent = 'New Game';
		button1.addEventListener('click', handleContinue);
	} else {
		button2 = document.createElement('button');
		let handleExit = _ => {
			DIALOG.classList.remove('open');
			resolving = false;
		};
		let handler1, handler2;
		if (type == 'reset') {
			message.textContent = 'Are you sure you want to reset the game?';
			handler1 = handleContinue;
			handler2 = handleExit;
		} else if (type == 'win') {
			message.textContent = 'You Win!, Do you want to continue?';
			handler1 = handleExit;
			handler2 = handleContinue;
		}
		button1.textContent = 'Yes';
		button2.textContent = 'No';
		button1.addEventListener('click', handler1);
		button2.addEventListener('click', handler2);
	}
	let action = DIALOG.querySelector('.action');
	action.innerHTML = '';
	if (button2) action.appendChild(button2);
	action.appendChild(button1);
	DIALOG.classList.add('open');
	yield;
	let newBoard = generateBoard(boardSize);
	newBoard = addNewNumber(newBoard);
	SCORE = 0;
	updateBoard(BOARD, newBoard);
	updateScore(SCORE);
	PREV_STATE = {};
	disablePrevBtn();
	disableResetBtn();
	resolving = false;
};

const setPreviousState = function () {
	let { board, score } = PREV_STATE;
	updateBoard(BOARD, board);
	SCORE = score;
	updateScore(score);
	disablePrevBtn();
	PREV_STATE = {};
};

document.addEventListener('DOMContentLoaded', function () {
	BOARD = generateBoard(boardSize);
	BOARD = addNewNumber(BOARD);
	renderBoard(BOARD);
	updateBoard = (function () {
		var cells = document.getElementsByClassName('cell');
		return function (oldBoard, newBoard) {
			let i, j;
			for (i = 0; i < boardSize; i++) {
				for (j = 0; j < boardSize; j++) {
					let newValue = newBoard[i][j];
					cells[i * boardSize + j].innerHTML =
						newValue == 0 ? '' : `<div class="color${newValue}">${newValue}</div>`;
					oldBoard[i][j] = newValue;
				}
			}
		};
	})();
	updateScore = (function () {
		let elem = document.getElementById('current_score');
		return function (score) {
			elem.textContent = score;
		};
	})();
	updateHighScore = (function () {
		let highScore = getHighScore();
		let elem = document.getElementById('high_score');
		elem.textContent = highScore;
		return function (score) {
			elem.textContent = score;
			localStorage.setItem('highScore', score);
		};
	})();
	animateSlide = (function () {
		let cells = [...document.getElementsByClassName('cell')];
		return function (state) {
			let { newBoard, score, win, animation } = state;
			let lastIndex = animation.length - 1;
			animation.forEach(([from, to], index) => {
				let [i, j] = from,
					[k, l] = to;
				let elem1 = cells.find(cell => cell.id == `[${i}, ${j}]`);
				let elem2 = cells.find(cell => cell.id == `[${k}, ${l}]`);
				let item = elem1?.firstElementChild;
				if (item && elem2) {
					let diff = elem2.offsetLeft - elem1.offsetLeft;
					let axis = 'X';
					if (diff == 0) {
						diff = elem2.offsetTop - elem1.offsetTop;
						axis = 'Y';
					}
					if (index == lastIndex)
						item.addEventListener(
							'transitionend',
							() => {
								reRender({ newBoard, score, win, animation });
								checkGameOver(newBoard);
							},
							{ once: true }
						);
					item.style.transform = `translate${axis}(${diff}px)`;
				} else throw 'cannot animate missing element/s';
			});
		};
	})();
	[enableResetBtn, disableResetBtn] = (function () {
		let resetButton = document.getElementById('reset');
		resetButton.addEventListener('click', () => {
			RESET = resetBoard('reset');
			RESET.next();
		});
		resetButton.disabled = true;
		return [
			function () {
				if (resetButton.disabled) resetButton.disabled = false;
			},
			function () {
				RESET = resetBoard('reset');
				resetButton.disabled = true;
			},
		];
	})();
	[enablePrevBtn, disablePrevBtn] = (function () {
		let prevButton = document.getElementById('prev');
		prevButton.addEventListener('click', () => setPreviousState());
		prevButton.disabled = true;
		return [
			function () {
				if (prevButton.disabled) prevButton.disabled = false;
			},
			function () {
				prevButton.disabled = true;
			},
		];
	})();
	DIALOG = document.getElementById('prompt');

	document.addEventListener('keydown', handleKeydown);
	document.addEventListener('touchstart', handleSwipe);
	document.addEventListener('touchend', handleSwipe);

	startNewGame();
});
const startNewGame = function () {
	let board = generateBoard(boardSize);
	board = addNewNumber(board);
	if (board !== null) updateBoard(BOARD, board);
};
const cloneBoard = function (board) {
	let clone = [];
	board.forEach((set, index) => {
		clone.push([]);
		set.forEach(value => {
			clone[index].push(value);
		});
	});
	return clone;
};
const getRandomNumber = function (max) {
	return Math.floor(Math.random() * max);
};
const getRandomEmptySlot = function (board) {
	let emptySlots = [];
	board.forEach((set, row) => {
		set.forEach((value, col) => {
			let slot = [row, col];
			if (value == 0) emptySlots.push(slot);
		});
	});
	if (emptySlots.length == 0) return null;
	if (emptySlots.length == 1) return emptySlots[0];
	let rand = getRandomNumber(emptySlots.length - 1);
	return emptySlots[rand];
};
const getNewNumber = function () {
	let probability = getRandomNumber(9);
	if (probability == 0) return 4;
	return 2;
};
const addNewNumber = function (board) {
	let slot = getRandomEmptySlot(board);
	if (slot === null) return null;
	let [row, col] = slot;
	let newBoard = cloneBoard(board);
	let number = getNewNumber();
	newBoard[row][col] = number;
	return newBoard;
};
const generateBoard = function (size) {
	let i,
		j,
		board = [];
	for (i = 0; i < size; i++) {
		board.push([]);
		for (j = 0; j < size; j++) {
			board[i].push(0);
		}
	}
	return board;
};
const renderBoard = function (board) {
	let gridElement = document.getElementById('grid');
	let html = board
		.map((col, i) => {
			return col
				.map((value, j) => {
					return value == 0
						? `<div id="[${i}, ${j}]" class="cell"></div>`
						: `<div id="[${i}, ${j}]" class="cell"><div class="color${value}">${value}</div></div>`;
				})
				.join('');
		})
		.join('');
	gridElement.innerHTML = html;
};

const getDirection = function (code) {
	if (code == 'ArrowLeft') {
		return 'left';
	} else if (code == 'ArrowRight') {
		return 'right';
	} else if (code == 'ArrowUp') {
		return 'up';
	} else if (code == 'ArrowDown') {
		return 'down';
	} else return 'invalid';
};

const getLeftResolvePath = function (board) {
	let i,
		j,
		len = board.length,
		paths = [];
	for (i = 0; i < len; i++) {
		paths.push([]);
		for (j = 0; j < len; j++) {
			paths[i].push([i, j]);
		}
	}
	return paths;
};
const getRightResolvePath = function (board) {
	let i,
		j,
		len = board.length,
		paths = [];
	for (i = 0; i < len; i++) {
		paths.push([]);
		for (j = len - 1; j >= 0; j--) {
			paths[i].push([i, j]);
		}
	}
	return paths;
};
const getUpResolvePath = function (board) {
	let i,
		j,
		len = board.length,
		paths = [];
	for (j = 0; j < len; j++) {
		paths.push([]);
		for (i = 0; i < len; i++) {
			paths[j].push([i, j]);
		}
	}
	return paths;
};
const getDownResolvePath = function (board) {
	let i,
		j,
		len = board.length,
		paths = [];
	for (j = 0; j < len; j++) {
		paths.push([]);
		for (i = len - 1; i >= 0; i--) {
			paths[j].push([i, j]);
		}
	}
	return paths;
};

const getResolvePath = function (board, direction) {
	switch (direction) {
		case 'left':
			return getLeftResolvePath(board);
		case 'right':
			return getRightResolvePath(board);
		case 'up':
			return getUpResolvePath(board);
		case 'down':
			return getDownResolvePath(board);
	}
};

const resolveSet = function (set) {
	let i,
		j = 1,
		len = set.length;
	let val1,
		val2,
		newSet = [...set];
	let score = 0,
		is2048 = false,
		animationPath = [];
	for (i = 0; i < len - 1; i++) {
		val1 = newSet[i];
		if (j <= i) j = i + 1;
		for (; j < len; j++) {
			val2 = newSet[j];
			if (val2 == 0) continue;
			if (val1 == 0) {
				newSet[i] = val2;
				animationPath.push([j, i]);
				i--;
			} else if (val1 == val2) {
				newSet[i] += val2;
				score += newSet[i];
				if (!is2048 && newSet[i] == 2048) is2048 = true;
				animationPath.push([j, i]);
			} else if (j != i + 1) {
				newSet[i + 1] = val2;
				animationPath.push([j, i + 1]);
			} else break;
			newSet[j] = 0;
			break;
		}
		if (j == len) return { newSet, score, is2048, animationPath };
	}
	return { newSet, score, is2048, animationPath };
};

const resolveBoard = function (board, direction) {
	let set,
		totalScore = 0,
		win = false,
		paths = getResolvePath(board, direction),
		animation = [];
	let newBoard = generateBoard(board.length);
	paths.forEach(path_set => {
		set = path_set.map(([i, j]) => board[i][j]);
		let { newSet, score, is2048, animationPath } = resolveSet(set);
		totalScore += score;
		if (!win && is2048) win = true;
		path_set.forEach(([i, j]) => {
			newBoard[i][j] = newSet.shift();
		});
		animationPath.forEach(([from, to]) => {
			animation.push([path_set[from], path_set[to]]);
		});
	});
	return { newBoard, score: totalScore, win, animation };
};
