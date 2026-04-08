const ROWS = 15;
const COLS = 23;
const TOTAL_PAIRS = 100; 
const COLORS = ['#FF5733', '#33FF57', '#3357FF', '#F333FF', '#FFFF33', '#33FFFF', '#FFA500', '#800080', '#008080', '#A52A2A'];

let board = Array(ROWS).fill().map(() => Array(COLS).fill(null));
let score = 0;
let timeLeft = 120;
let timerInterval;

// --- 獲取 HTML 元素 ---
const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start-btn');
const timerDisplay = document.getElementById('timer');
const scoreDisplay = document.getElementById('score');
const gameContainer = document.getElementById('game-container');
const resetBtn = document.getElementById('reset-btn');

// --- 計時器邏輯 ---
function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    
    timeLeft = 120;
    timerInterval = setInterval(() => {
        timeLeft--;
        timerDisplay.innerText = `剩餘時間: ${timeLeft}s`;
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            alert(`時間到！最終得分: ${score}`);
            
            // 修改這裡：不再 reload，而是手動顯示開始畫面
            startScreen.classList.remove('hidden');
            gameContainer.innerHTML = ''; // 清空棋盤
        }
    }, 1000);
}

// --- 初始化遊戲 ---
function initGame() {
    score = 0;
    scoreDisplay.innerText = `得分: ${score}`;
    board = Array(ROWS).fill().map(() => Array(COLS).fill(null));

    let pool = [];
    for (let i = 0; i < TOTAL_PAIRS; i++) {
        const color = COLORS[i % 10];
        pool.push(color, color);
    }
    pool.sort(() => Math.random() - 0.5);

    let positions = [];
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) positions.push({r, c});
    }
    positions.sort(() => Math.random() - 0.5);

    for (let i = 0; i < 200; i++) {
        const pos = positions[i];
        board[pos.r][pos.c] = pool[i];
    }
    
    renderBoard();
    startTimer();
}

// --- 渲染畫面邏輯 ---
function renderBoard() {
    gameContainer.innerHTML = ''; 

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            
            if (board[r][c]) {
                cell.style.backgroundColor = board[r][c];
                cell.classList.add('block');
            } else {
                cell.onclick = () => checkMatch(r, c);
            }
            gameContainer.appendChild(cell);
        }
    }
}

// --- 檢測與消除邏輯 ---
function checkMatch(r, c) {
    if (board[r][c] !== null) return;

    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    let foundMatches = [];

    directions.forEach(([dr, dc]) => {
        let currR = r + dr;
        let currC = c + dc;
        while (currR >= 0 && currR < ROWS && currC >= 0 && currC < COLS) {
            if (board[currR][currC]) {
                foundMatches.push({ r: currR, c: currC, color: board[currR][currC] });
                break; 
            }
            currR += dr;
            currC += dc;
        }
    });

    let matchToEliminate = [];
    for (let i = 0; i < foundMatches.length; i++) {
        for (let j = i + 1; j < foundMatches.length; j++) {
            if (foundMatches[i].color === foundMatches[j].color) {
                // 原本邏輯不變，但將點擊的空格座標 (r, c) 傳入用於視覺計算
                matchToEliminate.push(foundMatches[i], foundMatches[j]);
            }
        }
    }

    if (matchToEliminate.length > 0) {
        // --- 修改點：將點擊的座標 (r, c) 傳遞給 eliminate 用於視覺定位 ---
        eliminate(matchToEliminate, r, c);
    } else {
        timeLeft = Math.max(0, timeLeft - 20);
        timerDisplay.innerText = `剩餘時間: ${timeLeft}s`;
        
        timerDisplay.style.color = 'red';
        setTimeout(() => { 
            timerDisplay.style.color = 'white'; 
        }, 500);
    }
} 

// --- 消除與計分 ---
// --- 修改點：現在接收原本的點擊座標 clickR, clickC ---
function eliminate(points, clickR, clickC) {
    // --- 新增：畫出引導線 ---
    drawGuideLines(points, clickR, clickC);

    const uniquePoints = [];
    const seen = new Set();

    points.forEach(p => {
        const key = `${p.r},${p.c}`;
        if (!seen.has(key)) {
            seen.add(key);
            uniquePoints.push(p);
        }
    });

    // --- 新增：視覺消失動畫 ---
    uniquePoints.forEach(p => {
        const index = p.r * COLS + p.c;
        const cell = gameContainer.children[index];
        if (cell) {
            cell.classList.add('eliminating'); // 觸發 CSS 縮小消失動畫
        }
    });

    // 原本數據邏輯與計分：搬到 setTimeout 內，等待動畫完成後重刷
    setTimeout(() => {
        uniquePoints.forEach(p => {
            if (board[p.r][p.c] !== null) {
                board[p.r][p.c] = null;
                score += 1;
            }
        });
        scoreDisplay.innerText = `得分: ${score}`;
        renderBoard(); // 動畫完重新渲染
    }, 400); // 動畫時間與 CSS 對應
}

// --- 新增：產生圓形虛線引導線函式 ---
function drawGuideLines(points, clickR, clickC) {
    const cellSize = 30; // 配合 CSS Grid 設定
    const gap = 2;       // 配合 CSS Grid設定
    const padding = 10; // 配合 CSS 中 #game-container 的 padding

    points.forEach(p => {
        const line = document.createElement('div');
        line.classList.add('guide-line');

        // 計算中心點座標 (加上 padding)以確保在圓格中間
        const startX = padding + clickC * (cellSize + gap) + cellSize / 2;
        const startY = padding + clickR * (cellSize + gap) + cellSize / 2;
        const endX = padding + p.c * (cellSize + gap) + cellSize / 2;
        const endY = padding + p.r * (cellSize + gap) + cellSize / 2;

        const isHorizontal = clickR === p.r;
        
        if (isHorizontal) {
            const width = Math.abs(endX - startX);
            line.classList.add('line-h'); 
            line.style.width = `${width}px`;
            line.style.left = `${Math.min(startX, endX)}px`;
            line.style.top = `${startY}px`; 
        } else {
            const height = Math.abs(endY - startY);
            line.classList.add('line-v'); 
            line.style.height = `${height}px`;
            line.style.left = `${startX}px`;
            line.style.top = `${Math.min(startY, endY)}px`;
        }

        // 重要：加在 #wrapper 裡面，這樣 position: absolute 才會相對於棋盤定位
        document.getElementById('wrapper').appendChild(line);

        // 動畫一小段時間後移除
        setTimeout(() => line.remove(), 300);
    });
}

// --- 監聽器 ---
startBtn.addEventListener('click', () => {
    startScreen.classList.add('hidden'); 
    initGame(); 
});

// --- 重置按鈕邏輯：跳回主畫面 ---
resetBtn.addEventListener('click', () => {
//    if (confirm("確定要放棄目前進度並回到主畫面嗎？")) {
        // 1. 停止目前的計時器，防止倒數繼續進行
        if (timerInterval) clearInterval(timerInterval);

        // 2. 顯示開始畫面 (移除 hidden 類別)
        startScreen.classList.remove('hidden');

        // 3. 清空棋盤視覺內容，讓畫面乾淨
        gameContainer.innerHTML = '';
        
        // 4. 重置分數與時間顯示 (視覺回饋)
        score = 0;
        timeLeft = 120;
        scoreDisplay.innerText = `得分: 0`;
        timerDisplay.innerText = `剩餘時間: 120s`;
        timerDisplay.style.color = 'white'; // 確保顏色回到白色
//    }
});