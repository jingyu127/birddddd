// 遊戲物件變數
let bird;
let pipes = [];
let score = 0;
let gameState = 'start'; // 'start', 'playing', 'gameOver'

// 圖片變數
let birdImg;
let skyImg;
let pipeImg;
let startImg;

// 圖片檔案名稱 (請確認這些檔案在 'assets' 資料夾中)
const BIRD_FILE = 'assets/bird.png';
const SKY_FILE = 'assets/sky.png';
const PIPE_FILE = 'assets/pipe.png';
const START_FILE = 'assets/start.png';

// 背景滾動速度
const BACKGROUND_SCROLL_SPEED = 1;

/**
 * 載入所有遊戲所需的圖片資源
 */
function preload() {
    birdImg = loadImage(BIRD_FILE);
    skyImg = loadImage(SKY_FILE);
    pipeImg = loadImage(PIPE_FILE);
    startImg = loadImage(START_FILE);
}

/**
 * 設定畫布和初始化遊戲物件
 */
function setup() {
    createCanvas(800, 600); 
    bird = new Bird();
    pipeTimer = 100;
}

// =======================================================
//                          Bird Class (小鳥類別)
// =======================================================

class Bird {
    constructor() {
        this.y = height / 2;
        this.x = width / 4;
        this.velocity = 0;
        this.gravity = 0.3;  // 掉落速度
        this.lift = -6;      // 上升推力
        
        // 根據 443x311 圖片比例設定寬度和高度
        this.w = 55; // 最終設定的小鳥寬度
        this.h = this.w * (311 / 443); // 保持比例的高度
        
        this.isAlive = true;
    }

    show() {
        if (!this.isAlive && gameState === 'playing') return; 
        
        push();
        translate(this.x, this.y);
        // 根據速度計算旋轉角度
        let angle = map(this.velocity, -5, 5, -PI / 4, PI / 4, true); 
        rotate(angle);
        imageMode(CENTER);
        image(birdImg, 0, 0, this.w, this.h); 
        imageMode(CORNER);
        pop();
    }

    update() {
        if (!this.isAlive) return;

        this.velocity += this.gravity; 
        this.y += this.velocity;       

        this.velocity = constrain(this.velocity, -15, 15);

        // 檢查是否碰到地面或天花板 (使用 this.h)
        const groundLevel = height - this.h / 2; 

        if (this.y > groundLevel) {
            this.y = groundLevel;
            this.velocity = 0;
            
            // 落地時切換遊戲狀態
            if (this.isAlive) {
                this.isAlive = false; 
                gameState = 'gameOver'; 
            }
        }
        
        if (this.y < this.h / 2) { 
            this.y = this.h / 2;
            this.velocity = 0;
        }
    }

    jump() {
        if (this.isAlive) {
            this.velocity = this.lift;
        }
    }
}

// =======================================================
//                          Pipe Class (水管類別)
// =======================================================

class Pipe {
    constructor() {
        this.spacing = 170; // 上下水管之間的間隙大小
        this.center = random(this.spacing, height - this.spacing); 
        this.top = this.center - this.spacing / 2;
        this.bottom = height - (this.center + this.spacing / 2); 
        this.x = width;
        this.w = 50;
        this.speed = 3;
        this.passed = false;
    }

    show() {
        // 下方水管
        image(pipeImg, this.x, height - this.bottom, this.w, this.bottom);

        // 上方水管 (垂直翻轉)
        push();
        translate(this.x + this.w / 2, this.top);
        scale(1, -1);
        image(pipeImg, -this.w / 2, 0, this.w, this.top); 
        pop();
    }

    update() {
        this.x -= this.speed;
    }

    // 寬容的矩形碰撞檢測
    hits(bird) {
        const effectiveW = bird.w * 0.95; 
        const effectiveH = bird.h * 0.95;
        
        // 1. 檢查水管的 X 範圍 (小鳥寬度)
        if (bird.x + effectiveW / 2 > this.x && bird.x - effectiveW / 2 < this.x + this.w) {
            
            // 2. 檢查 Y 範圍 (小鳥高度)
            if (bird.y - effectiveH / 2 < this.top || bird.y + effectiveH / 2 > height - this.bottom) {
                return true;
            }
        }
        return false;
    }

    offscreen() {
        return this.x < -this.w;
    }
}

// =======================================================
//                          Main Loop (主迴圈)
// =======================================================

let backgroundX = 0;

function draw() {
    // 1. 繪製背景 (滾動效果)
    image(skyImg, backgroundX, 0, width, height);
    image(skyImg, backgroundX + width, 0, width, height);
    backgroundX -= BACKGROUND_SCROLL_SPEED;
    if (backgroundX < -width) {
        backgroundX = 0;
    }

    if (gameState === 'playing') {
        
        for (let i = pipes.length - 1; i >= 0; i--) {
            pipes[i].update();
            pipes[i].show();

            // 碰撞檢測
            if (pipes[i].hits(bird)) {
                bird.isAlive = false;
                gameState = 'gameOver'; 
            }

            // 分數計算
            if (!pipes[i].passed && pipes[i].x < bird.x) {
                pipes[i].passed = true;
                score++;
            }

            if (pipes[i].offscreen()) {
                pipes.splice(i, 1);
            }
        }

        // 創建新的水管
        if (frameCount % 100 === 0) {
            pipes.push(new Pipe());
        }

        bird.update();
        bird.show();
        
        // 繪製分數 (置中顯示)
        fill(255);       
        textSize(48);    
        textAlign(CENTER, TOP); 
        text(score, width / 2, 20); 
        
        textSize(20);
        textAlign(CENTER, TOP);
        fill(255, 255, 255, 180);
        text('SCORE', width / 2, 80);

    } else if (gameState === 'start') {
        // 啟動畫面
        fill(255);
        textSize(64); // 遊戲標題
        textAlign(CENTER, CENTER);
        text('FLAPPY BIRD', width / 2, height / 2 - 150); 
        
        // 繪製開始按鈕圖片
        const buttonW = 200; // 按鈕寬度
        const buttonH = 100; // 按鈕高度
        const buttonX = width / 2 - buttonW / 2; // 按鈕 X 座標
        const buttonY = height / 2 - buttonH / 2; // 按鈕 Y 座標
        
        image(startImg, buttonX, buttonY, buttonW, buttonH);
        
        textSize(24);
        text('Click on Start button to begin', width / 2, height / 2 + 150);
        bird.show();

   } else if (gameState === 'gameOver') {
        // 遊戲結束畫面
        fill(255);
        textSize(64);
        textAlign(CENTER, CENTER);
        text('Game Over!', width / 2, height / 2 - 50);
        textSize(32);
        text('Final Score: ' + score, width / 2, height / 2 + 20);
        textSize(24);
        text('Click to Restart', width / 2, height / 2 + 80);
        
        // 移除這行，讓小鳥在遊戲結束時消失
        // bird.show(); 
    }
}


/**
 * 處理滑鼠點擊 (控制小鳥跳躍和遊戲狀態轉換)
 */
function mousePressed() {
    if (gameState === 'playing') {
        // 在遊戲中，點擊即為跳躍
        bird.jump();
    } else if (gameState === 'start') {
        // 修正遊戲卡住問題：只判斷是否點擊到按鈕
        const buttonW = 200;
        const buttonH = 100;
        const buttonX = width / 2 - buttonW / 2; 
        const buttonY = height / 2 - buttonH / 2;
        
        // 判斷是否點擊在按鈕範圍內
        if (mouseX > buttonX && mouseX < buttonX + buttonW && 
            mouseY > buttonY && mouseY < buttonY + buttonH) {
            
            // 僅切換狀態，讓小鳥在重力作用下開始下降
            gameState = 'playing';
            // 注意：這裡不再執行 bird.jump()
        }

    } else if (gameState === 'gameOver') {
        // 重新開始遊戲
        resetGame();
    }
}

/**
 * 重置所有遊戲變數，準備重新開始
 */
function resetGame() {
    score = 0;
    pipes = [];
    bird = new Bird(); // 重新創建小鳥，重置所有物理參數
    gameState = 'playing';
}