'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var EMPTY = -1;
var PLAYER = 0;
var OPPONENT = 1;

// DOM
var $board = document.querySelector('.board');
var $cells = Array.from($board.children);
var $diceRoll = document.querySelector('.dice-roll');
var $scores = document.querySelector('.scores');
var $message = document.querySelector('.message');
var $playBtn = document.querySelector('.play-btn');

var board = emptyBoard();
var winPatterns = [448, 56, 7, // rows
292, 146, 73, // cols
273, 84 // diags
];

// Minimax (http://www.geeksforgeeks.org/minimax-algorithm-in-game-theory-set-1-introduction/)

var AI = function () {
    function AI() {
        var difficulty = arguments.length <= 0 || arguments[0] === undefined ? 1 : arguments[0];

        _classCallCheck(this, AI);

        this.difficulty = difficulty;
    }

    AI.prototype.findBestMove = function findBestMove() {
        return this.minimax(this.difficulty, OPPONENT).position;
    };

    AI.prototype.minimax = function minimax(depth, minmaxer) {

        var nextMoves = getAvailableMoves();
        var bestMove = { score: minmaxer === OPPONENT ? -10000 : 10000, position: -1 };

        // Collect every available move
        var randomizedMoves = [];

        if (!nextMoves.length || depth === 0) {
            bestMove.score = this.evaluate();
        } else {

            for (var i = 0; i < nextMoves.length; ++i) {

                var moveSimulation = nextMoves[i];
                board[moveSimulation] = minmaxer;

                var score = this.minimax(depth - 1, minmaxer === OPPONENT ? PLAYER : OPPONENT).score;

                randomizedMoves.push({ score: score, position: moveSimulation });

                if (minmaxer === OPPONENT && score > bestMove.score || minmaxer === PLAYER && score < bestMove.score) {
                    bestMove = { score: score, position: moveSimulation };
                }

                board[moveSimulation] = EMPTY;
            }
        }

        // Take one random move if several moves with the same score are available.
        if (randomizedMoves.length) {

            // First AI move
            if (randomizedMoves.length === board.length) {
                bestMove = randomizedMoves[Math.floor(Math.random() * randomizedMoves.length)];
            } else {
                randomizedMoves = randomizedMoves.filter(function (m) {
                    return m.score === bestMove.score;
                });
                bestMove = randomizedMoves[Math.floor(Math.random() * randomizedMoves.length)];
            }
        }

        return bestMove;
    };

    // Score Heuristic Evaluation

    AI.prototype.evaluate = function evaluate() {

        var score = 0;

        score += this.evaluateLine(0, 1, 2); // row 1
        score += this.evaluateLine(3, 4, 5); // row 2
        score += this.evaluateLine(6, 7, 8); // row 3
        score += this.evaluateLine(0, 3, 6); // col 1
        score += this.evaluateLine(1, 4, 7); // col 2
        score += this.evaluateLine(2, 5, 8); // col 3
        score += this.evaluateLine(0, 4, 8); // diag.
        score += this.evaluateLine(2, 4, 6); // alt. diag.

        return score;
    };

    AI.prototype.evaluateLine = function evaluateLine(a, b, c) {

        var score = 0;
        var cA = board[a];
        var cB = board[b];
        var cC = board[c];

        // first cell
        if (cA == OPPONENT) {
            score = 1;
        } else if (cA == PLAYER) {
            score = -1;
        }

        // second cell
        if (cB == OPPONENT) {
            if (score == 1) {
                score = 10;
            } else if (score == -1) {
                return 0;
            } else {
                score = 1;
            }
        } else if (cB == PLAYER) {
            if (score == -1) {
                score = -10;
            } else if (score == 1) {
                return 0;
            } else {
                score = -1;
            }
        }

        // third cell
        if (cC == OPPONENT) {
            if (score > 0) {
                score *= 10;
            } else if (score < 0) {
                return 0;
            } else {
                score = 1;
            }
        } else if (cC == PLAYER) {
            if (score < 0) {
                score *= 10;
            } else if (score > 1) {
                return 0;
            } else {
                score = -1;
            }
        }

        return score;
    };

    return AI;
}();

var HumanPlayer = function () {
    function HumanPlayer() {
        _classCallCheck(this, HumanPlayer);

        this.name = 'You';
        this.win = 0;
    }

    HumanPlayer.prototype.play = function play() {
        $message.textContent = 'Your turn!';

        return new Promise(function (resolve) {
            var disposeFn = event($board, 'click', function (e) {
                var target = e.target;
                if (target.classList.contains('cell')) {
                    // If we hit a cell
                    var idx = $cells.indexOf(target); // get the cell index.
                    if (getAvailableMoves().indexOf(idx) !== -1) {
                        // must be available
                        disposeFn();
                        resolve(idx);
                    }
                }
            });
        });
    };

    return HumanPlayer;
}();

var AIPlayer = function () {
    function AIPlayer() {
        var difficulty = arguments.length <= 0 || arguments[0] === undefined ? 2 : arguments[0];

        _classCallCheck(this, AIPlayer);

        this.difficulty = difficulty;
        this.name = this._getRandomName() + '(AI)';
        this.win = 0;
    }

    AIPlayer.prototype._getRandomName = function _getRandomName() {
        return AIPlayer.names[Math.floor(Math.random() * (AIPlayer.names.length - 1))];
    };

    AIPlayer.prototype.setBoard = function setBoard() {
        this.ai = new AI(1);
    };

    AIPlayer.prototype.play = function play() {
        var _this = this;

        $message.textContent = this.name + '\'s turn';
        return new Promise(function (res) {
            var randomTimer = Math.floor(Math.random() * 1000 + 500);
            var move = _this.ai.findBestMove();
            setTimeout(function () {
                return res(move);
            }, randomTimer);
        });
    };

    return AIPlayer;
}();

AIPlayer.names = ['Lim', 'Emily', 'Celsia', 'Pavel', 'Denim', 'Kelvin', 'Nelson', 'Alicia', 'Mary', 'Edward', 'Darell', 'Malvin', 'Berlin'];

var player = null;
var opponent = null;
var startingPlayer = null;
var currentPlayer = null;

/**
 * Game utils
 */
function emptyBoard() {
    return [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY];
}

function hasAvailableMove() {
    return board.some(function (cell) {
        return cell === EMPTY;
    });
}

function getAvailableMoves() {
    return board.reduce(function (acc, current, idx) {
        current === EMPTY && acc.push(idx);
        return acc;
    }, []);
}

function hasWon(player) {

    var pattern = board.reduce(function (acc, curr, i) {
        curr === player.symbol && (acc |= 1 << i);
        return acc;
    }, 0);

    return winPatterns.some(function (winPattern) {
        return (pattern & winPattern) == winPattern;
    });
}

function getWinner() {
    if (hasWon(player)) return player;
    if (hasWon(opponent)) return opponent;
    return null;
}

function clearBoard() {
    board = emptyBoard();
    $cells.forEach(function (cell) {
        cell.classList.remove('cross');
        cell.classList.remove('circle');
    });
}

function updateBoard(idx, symbol) {
    board[idx] = symbol;
    $board.children[idx].classList.add(symbol === PLAYER ? 'cross' : 'circle');
}

function isOver() {
    return hasWon(player) || hasWon(opponent) || !hasAvailableMove();
}

function declareTurnWinner() {

    var winner = getWinner();

    if (winner) {

        winner.win++;
        $message.textContent = winner.name + ' win!';
        $scores.children[winner.symbol].querySelectorAll('li')[winner.win - 1].classList.add('won');

        if (player.win == 3) {
            endState(player);
        } else if (opponent.win == 3) {
            endState(opponent);
        } else {
            nextTurn();
        }
    } else {
        $message.textContent = 'Draw!';
        nextTurn();
    }
}

function nextTurn() {
    $playBtn.textContent = 'Next turn';
    $playBtn.classList.remove('hide');

    var disposeEvent = event($playBtn, 'click', function () {
        currentPlayer = startingPlayer;
        $playBtn.classList.add('hide');
        clearBoard();
        disposeEvent();
        takeTurn();
    });
}

function getOpponent(which) {
    return which === player ? opponent : player;
}

function takeTurn() {
    return currentPlayer.play().then(function (move) {
        updateBoard(move, currentPlayer.symbol);
        currentPlayer = getOpponent(currentPlayer);
        return isOver() ? declareTurnWinner() : takeTurn();
    });
}

/**
 * Events handling
 */
var events = [];

function event(target, type, handler) {
    target.addEventListener(type, handler);
    return function disposeEvent() {
        target.removeEventListener(type, handler);
    };
}

function removeEvents() {
    events.forEach(function (disposeFn) {
        return disposeFn();
    });
    events = [];
}

/**
 * Game States
 */
function initState() {

    removeEvents();

    $scores.classList.add('hide');
    $diceRoll.classList.add('hide');
    $playBtn.classList.remove('hide');

    $playBtn.textContent = 'Click to start';
    $message.textContent = 'Tic Tac Toe';

    events.push(event($playBtn, 'click', playerSetup));
}

function dice() {

    $playBtn.classList.add('hide');
    document.body.classList.remove('playing');

    setTimeout(function () {
        $playBtn.textContent = 'Click to throw the dice';
        $playBtn.classList.remove('hide');
    }, 500);

    var disposeEvent = event($playBtn, 'click', onDiceRoll);

    function onDiceRoll() {

        $playBtn.classList.add('hide');

        $diceRoll.querySelector('.dice-rolling').textContent = 'The dices are rolling!';

        var scoreA = Math.floor(Math.random() * 5) + 1;
        var scoreB = Math.floor(Math.random() * 3) + 1; // Yes...cheating here, so player has more chance to start... :)

        while (scoreA === scoreB) {
            scoreA = Math.floor(Math.random() * 5) + 1;
            scoreB = Math.floor(Math.random() * 3) + 1;
        }

        startingPlayer = scoreA > scoreB ? player : opponent;
        currentPlayer = startingPlayer;

        disposeEvent();

        setTimeout(function () {

            $diceRoll.querySelector('.dice-score').textContent = 'You: ' + scoreA + ' - ' + opponent.name + ': ' + scoreB + '.';
            $diceRoll.querySelector('.dice-result').textContent = startingPlayer.name + ' start!';

            $playBtn.textContent = 'Start';
            $playBtn.classList.remove('hide');

            events.push(event($playBtn, 'click', playingState));
        }, 1000);
    }
}

function playerSetup() {

    removeEvents();

    $scores.classList.add('hide');
    $message.classList.add('hide');
    $playBtn.classList.add('hide');
    $board.classList.add('hide');
    $diceRoll.classList.remove('hide');

    $diceRoll.querySelector('.dice-rolling').textContent = '';
    $diceRoll.querySelector('.dice-score').textContent = '';
    $diceRoll.querySelector('.dice-result').textContent = '';

    player = new HumanPlayer();
    player.symbol = PLAYER;

    opponent = new AIPlayer();
    opponent.symbol = OPPONENT;
    opponent.setBoard(board);

    $diceRoll.querySelector('.opponent').textContent = 'You are playing against ' + opponent.name;

    dice();
}

function playingState() {

    removeEvents();
    clearBoard();
    Array.from($scores.querySelectorAll('li')).forEach(function (li) {
        return li.classList.remove('won');
    });

    $board.classList.remove('hide');
    $scores.classList.remove('hide');
    $playBtn.classList.add('hide');
    $diceRoll.classList.add('hide');
    $message.classList.remove('hide');

    $scores.children[PLAYER].querySelector('span').textContent = player.name;
    $scores.children[OPPONENT].querySelector('span').textContent = opponent.name;

    document.body.classList.add('playing');

    takeTurn();
}

function endState(winner) {
    removeEvents();

    $message.textContent = winner.name + ' wins the game!';
    document.body.classList.remove('playing');

    $playBtn.classList.remove('hide');
    $playBtn.textContent = 'Try again!';

    events.push(event($playBtn, 'click', playerSetup));
}

initState();