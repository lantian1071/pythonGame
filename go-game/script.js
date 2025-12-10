// 围棋游戏主逻辑
class GoGame {
    constructor() {
        this.boardSize = 9;
        this.board = Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(0)); // 0: 空, 1: 黑, 2: 白
        this.currentPlayer = 1; // 1: 黑子, 2: 白子
        this.gameOver = false;
        this.passCount = 0;
        this.capturedStones = { black: 0, white: 0 };
        
        this.canvas = document.getElementById('gameBoard');
        this.ctx = this.canvas.getContext('2d');
        this.cellSize = this.canvas.width / (this.boardSize - 1);
        
        this.difficulty = 2; // 1: 简单, 2: 中等, 3: 困难
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.drawBoard();
        this.updateStatus();
    }
    
    setupEventListeners() {
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        
        document.getElementById('pass-btn').addEventListener('click', () => this.passTurn());
        document.getElementById('reset-btn').addEventListener('click', () => this.resetGame());
        document.getElementById('difficulty').addEventListener('change', (e) => {
            this.difficulty = parseInt(e.target.value);
        });
    }
    
    handleCanvasClick(e) {
        if (this.gameOver || this.currentPlayer !== 1) return; // 只有玩家是黑子时才能点击
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const col = Math.round(x / this.cellSize);
        const row = Math.round(y / this.cellSize);
        
        if (this.isValidMove(row, col)) {
            this.makeMove(row, col);
            this.updateStatus();
            
            // 延迟让电脑下棋
            setTimeout(() => {
                if (!this.gameOver && this.currentPlayer === 2) {
                    this.aiMove();
                }
            }, 500);
        }
    }
    
    handleMouseMove(e) {
        if (this.gameOver || this.currentPlayer !== 1) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const col = Math.round(x / this.cellSize);
        const row = Math.round(y / this.cellSize);
        
        if (row >= 0 && row < this.boardSize && col >= 0 && col < this.boardSize && this.board[row][col] === 0) {
            // 这里可以添加预览效果
        }
    }
    
    isValidMove(row, col) {
        if (row < 0 || row >= this.boardSize || col < 0 || col >= this.boardSize) {
            return false;
        }
        
        if (this.board[row][col] !== 0) {
            return false;
        }
        
        // 检查是否违反了禁入点规则
        const tempBoard = this.copyBoard();
        tempBoard[row][col] = this.currentPlayer;
        
        // 检查是否能吃掉对方棋子
        const opponent = this.currentPlayer === 1 ? 2 : 1;
        const neighbors = this.getNeighbors(row, col);
        let hasLiberty = false;
        
        for (const [nRow, nCol] of neighbors) {
            if (tempBoard[nRow][nCol] === opponent) {
                const group = this.getGroup(nRow, nCol, tempBoard);
                if (this.getLibertyCount(group, tempBoard) === 0) {
                    // 可以吃掉对方棋子，所以这不是禁入点
                    return true;
                }
            } else if (tempBoard[nRow][nCol] === this.currentPlayer) {
                const group = this.getGroup(nRow, nCol, tempBoard);
                if (this.getLibertyCount(group, tempBoard) > 1) {
                    hasLiberty = true;
                }
            } else if (tempBoard[nRow][nCol] === 0) {
                hasLiberty = true;
            }
        }
        
        return hasLiberty;
    }
    
    makeMove(row, col) {
        if (!this.isValidMove(row, col)) return false;
        
        this.board[row][col] = this.currentPlayer;
        
        // 检查并移除被吃掉的棋子
        this.captureStones(row, col);
        
        // 切换玩家
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        this.passCount = 0;
        
        this.drawBoard();
        this.updateScore();
        
        return true;
    }
    
    captureStones(row, col) {
        const opponent = this.currentPlayer === 1 ? 2 : 1;
        const neighbors = this.getNeighbors(row, col);
        
        for (const [nRow, nCol] of neighbors) {
            if (this.board[nRow][nCol] === opponent) {
                const group = this.getGroup(nRow, nCol, this.board);
                if (this.getLibertyCount(group, this.board) === 0) {
                    // 移除整个组
                    for (const [gRow, gCol] of group) {
                        this.board[gRow][gCol] = 0;
                        if (this.currentPlayer === 1) {
                            this.capturedStones.white++;
                        } else {
                            this.capturedStones.black++;
                        }
                    }
                }
            }
        }
    }
    
    getNeighbors(row, col) {
        const neighbors = [];
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        
        for (const [dRow, dCol] of directions) {
            const nRow = row + dRow;
            const nCol = col + dCol;
            
            if (nRow >= 0 && nRow < this.boardSize && nCol >= 0 && nCol < this.boardSize) {
                neighbors.push([nRow, nCol]);
            }
        }
        
        return neighbors;
    }
    
    getGroup(row, col, board) {
        const color = board[row][col];
        if (color === 0) return [];
        
        const visited = new Set();
        const stack = [[row, col]];
        const group = [];
        
        while (stack.length > 0) {
            const [r, c] = stack.pop();
            const key = `${r},${c}`;
            
            if (visited.has(key)) continue;
            visited.add(key);
            
            if (board[r][c] === color) {
                group.push([r, c]);
                
                for (const [nRow, nCol] of this.getNeighbors(r, c)) {
                    if (!visited.has(`${nRow},${nCol}`) && board[nRow][nCol] === color) {
                        stack.push([nRow, nCol]);
                    }
                }
            }
        }
        
        return group;
    }
    
    getLibertyCount(group, board) {
        const liberties = new Set();
        
        for (const [row, col] of group) {
            for (const [nRow, nCol] of this.getNeighbors(row, col)) {
                if (board[nRow][nCol] === 0) {
                    liberties.add(`${nRow},${nCol}`);
                }
            }
        }
        
        return liberties.size;
    }
    
    aiMove() {
        if (this.gameOver) return;
        
        let move;
        
        switch (this.difficulty) {
            case 1: // 简单：随机下棋
                move = this.getRandomMove();
                break;
            case 2: // 中等：优先吃子或防守
                move = this.getMediumMove();
                break;
            case 3: // 困难：更复杂的策略
                move = this.getHardMove();
                break;
            default:
                move = this.getRandomMove();
        }
        
        if (move) {
            this.makeMove(move[0], move[1]);
            this.updateStatus();
        } else {
            // 如果没有合法的移动，则虚手
            this.passTurn();
        }
    }
    
    getRandomMove() {
        const validMoves = [];
        
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.isValidMove(row, col)) {
                    validMoves.push([row, col]);
                }
            }
        }
        
        if (validMoves.length > 0) {
            const randomIndex = Math.floor(Math.random() * validMoves.length);
            return validMoves[randomIndex];
        }
        
        return null;
    }
    
    getMediumMove() {
        // 优先考虑能吃掉对方棋子的位置
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.isValidMove(row, col)) {
                    // 检查这个位置是否能吃掉对方棋子
                    const tempBoard = this.copyBoard();
                    tempBoard[row][col] = this.currentPlayer;
                    
                    const opponent = this.currentPlayer === 1 ? 2 : 1;
                    const neighbors = this.getNeighbors(row, col);
                    
                    for (const [nRow, nCol] of neighbors) {
                        if (tempBoard[nRow][nCol] === opponent) {
                            const group = this.getGroup(nRow, nCol, tempBoard);
                            if (this.getLibertyCount(group, tempBoard) === 0) {
                                return [row, col]; // 可以吃掉对方棋子
                            }
                        }
                    }
                }
            }
        }
        
        // 检查是否需要防守（保护自己的棋子不被吃）
        const opponent = this.currentPlayer === 1 ? 2 : 1;
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col] === opponent) {
                    const group = this.getGroup(row, col, this.board);
                    if (this.getLibertyCount(group, this.board) === 1) {
                        // 对方棋子只剩一个气，尝试堵住
                        const liberties = this.getLibertyPositions(group, this.board);
                        if (liberties.length > 0) {
                            const [libRow, libCol] = liberties[0];
                            if (this.isValidMove(libRow, libCol)) {
                                return [libRow, libCol];
                            }
                        }
                    }
                }
            }
        }
        
        // 否则随机下棋
        return this.getRandomMove();
    }
    
    getHardMove() {
        // 困难级别：更复杂的策略
        // 优先考虑能吃掉对方棋子的位置
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.isValidMove(row, col)) {
                    // 检查这个位置是否能吃掉对方棋子
                    const tempBoard = this.copyBoard();
                    tempBoard[row][col] = this.currentPlayer;
                    
                    const opponent = this.currentPlayer === 1 ? 2 : 1;
                    const neighbors = this.getNeighbors(row, col);
                    
                    for (const [nRow, nCol] of neighbors) {
                        if (tempBoard[nRow][nCol] === opponent) {
                            const group = this.getGroup(nRow, nCol, tempBoard);
                            if (this.getLibertyCount(group, tempBoard) === 0) {
                                return [row, col]; // 可以吃掉对方棋子
                            }
                        }
                    }
                }
            }
        }
        
        // 检查是否需要防守（保护自己的棋子不被吃）
        const opponent = this.currentPlayer === 1 ? 2 : 1;
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col] === opponent) {
                    const group = this.getGroup(row, col, this.board);
                    if (this.getLibertyCount(group, this.board) === 1) {
                        // 对方棋子只剩一个气，尝试堵住
                        const liberties = this.getLibertyPositions(group, this.board);
                        if (liberties.length > 0) {
                            const [libRow, libCol] = liberties[0];
                            if (this.isValidMove(libRow, libCol)) {
                                return [libRow, libCol];
                            }
                        }
                    }
                }
            }
        }
        
        // 尝试占据有利位置（如星位）
        const starPoints = [
            [2, 2], [2, 6], 
            [6, 2], [6, 6], 
            [4, 4]
        ];
        
        for (const [row, col] of starPoints) {
            if (this.isValidMove(row, col)) {
                return [row, col];
            }
        }
        
        // 否则随机下棋
        return this.getRandomMove();
    }
    
    getLibertyPositions(group, board) {
        const liberties = [];
        
        for (const [row, col] of group) {
            for (const [nRow, nCol] of this.getNeighbors(row, col)) {
                if (board[nRow][nCol] === 0) {
                    const libertyKey = `${nRow},${nCol}`;
                    if (!liberties.some(pos => `${pos[0]},${pos[1]}` === libertyKey)) {
                        liberties.push([nRow, nCol]);
                    }
                }
            }
        }
        
        return liberties;
    }
    
    copyBoard() {
        return this.board.map(row => [...row]);
    }
    
    passTurn() {
        this.passCount++;
        
        if (this.passCount >= 2) {
            // 双方都虚手，游戏结束
            this.gameOver = true;
            this.endGame();
        } else {
            // 切换玩家
            this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
            this.updateStatus();
            
            // 如果是电脑的回合，延迟执行电脑的移动
            if (!this.gameOver && this.currentPlayer === 2) {
                setTimeout(() => {
                    this.aiMove();
                }, 500);
            }
        }
    }
    
    endGame() {
        const playerScore = this.calculateScore(1);
        const aiScore = this.calculateScore(2);
        
        let message = `游戏结束！`;
        if (playerScore > aiScore) {
            message += ` 玩家获胜！(玩家: ${playerScore}, 电脑: ${aiScore})`;
        } else if (aiScore > playerScore) {
            message += ` 电脑获胜！(玩家: ${playerScore}, 电脑: ${aiScore})`;
        } else {
            message += ` 平局！(玩家: ${playerScore}, 电脑: ${aiScore})`;
        }
        
        document.getElementById('status-message').textContent = message;
    }
    
    calculateScore(player) {
        // 简化的计分方式：棋子数量 + 领地数量
        let score = 0;
        
        // 计算棋子数量
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col] === player) {
                    score++;
                }
            }
        }
        
        // 加上提子数量
        if (player === 1) {
            score += this.capturedStones.white;
        } else {
            score += this.capturedStones.black;
        }
        
        return score;
    }
    
    updateScore() {
        const playerScore = this.calculateScore(1);
        const aiScore = this.calculateScore(2);
        
        document.getElementById('player-territory').textContent = playerScore;
        document.getElementById('ai-territory').textContent = aiScore;
    }
    
    resetGame() {
        this.board = Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(0));
        this.currentPlayer = 1;
        this.gameOver = false;
        this.passCount = 0;
        this.capturedStones = { black: 0, white: 0 };
        
        this.drawBoard();
        this.updateStatus();
        this.updateScore();
    }
    
    updateStatus() {
        if (this.gameOver) return;
        
        const playerText = this.currentPlayer === 1 ? '黑子' : '白子';
        const playerColor = this.currentPlayer === 1 ? '玩家' : '电脑';
        document.getElementById('status-message').textContent = `轮到${playerText} (${playerColor}) 下棋`;
    }
    
    drawBoard() {
        const ctx = this.ctx;
        const size = this.canvas.width;
        const padding = this.cellSize;
        
        // 清空画布
        ctx.clearRect(0, 0, size, size);
        
        // 绘制棋盘背景
        ctx.fillStyle = '#DEB887'; // 棋盘颜色
        ctx.fillRect(0, 0, size, size);
        
        // 绘制网格线
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        
        for (let i = 0; i < this.boardSize; i++) {
            // 水平线
            ctx.beginPath();
            ctx.moveTo(padding, padding + i * this.cellSize);
            ctx.lineTo(size - padding, padding + i * this.cellSize);
            ctx.stroke();
            
            // 垂直线
            ctx.beginPath();
            ctx.moveTo(padding + i * this.cellSize, padding);
            ctx.lineTo(padding + i * this.cellSize, size - padding);
            ctx.stroke();
        }
        
        // 绘制星位点
        ctx.fillStyle = '#000';
        const starPoints = [
            [2, 2], [2, 6], 
            [6, 2], [6, 6], 
            [4, 4]
        ];
        
        for (const [row, col] of starPoints) {
            ctx.beginPath();
            ctx.arc(
                padding + col * this.cellSize, 
                padding + row * this.cellSize, 
                3, 0, 2 * Math.PI
            );
            ctx.fill();
        }
        
        // 绘制棋子
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col] !== 0) {
                    const stoneX = padding + col * this.cellSize;
                    const stoneY = padding + row * this.cellSize;
                    
                    ctx.beginPath();
                    ctx.arc(stoneX, stoneY, this.cellSize * 0.45, 0, 2 * Math.PI);
                    
                    if (this.board[row][col] === 1) { // 黑子
                        ctx.fillStyle = '#000';
                        ctx.fill();
                        ctx.strokeStyle = '#555';
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    } else { // 白子
                        ctx.fillStyle = '#FFF';
                        ctx.fill();
                        ctx.strokeStyle = '#000';
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }
                }
            }
        }
    }
}

// 启动游戏
window.addEventListener('load', () => {
    new GoGame();
});