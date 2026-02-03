// --- Data Game ---
let player = { hp: 100, level: 1, maxHp: 100 };
let currentEnemy = { hp: 150, damage: 0, name: "Guardian Logika" }; 
let currentQuestion = null;
let currentSkill = {}; 

// --- Kontrol Waktu dan Soal ---
const CHALLENGE_TIME = 8;
let challengeTimer = null;

// --- Konstanta Damage ---
// Serangan Pemain ke Musuh (Tidak diubah, tetap 5-10)
const PLAYER_ATTACK_MIN = 5;
const PLAYER_ATTACK_MAX = 10;
// Serangan Musuh ke Pemain (Tidak diubah, tetap 5-8)
const ENEMY_ATTACK_MIN = 5;
const ENEMY_ATTACK_MAX = 8;

// ⭐ Konstanta BARU untuk Counter Damage (5-10)
const COUNTER_DAMAGE_MIN = 5;
const COUNTER_DAMAGE_MAX = 10;

// --- DOM Elements ---
const playerHPElement = document.getElementById('player-hp');
const playerLevelElement = document.getElementById('player-level');
const enemyHPElement = document.getElementById('enemy-hp');
const challengeArea = document.getElementById('challenge-area');
const challengeTitle = document.getElementById('challenge-title');
const soalMatematika = document.getElementById('soal-matematika'); 
const answerInput = document.getElementById('jawaban-input');
const actionPanel = document.getElementById('action-panel');
const challengeTimerElement = document.getElementById('challenge-timer');
const logContainer = document.getElementById('log-pesan'); 


// --- FUNGSI UTILITY ---

function setLogMessage(msg) {
    logContainer.innerHTML = `<p id="message">${msg}</p>`;
}

function updateUI(msg = null) {
    playerHPElement.textContent = player.hp;
    playerLevelElement.textContent = player.level;
    enemyHPElement.textContent = currentEnemy.hp;
    if (msg) setLogMessage(msg);

    if (player.hp <= 0 || currentEnemy.hp <= 0) {
        endGame();
    }
}

/**
 * Fungsi untuk menghasilkan angka acak dalam rentang min dan max (inklusif).
 */
function getRandomDamage(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// --- FUNGSI GENERATOR SOAL (Rentang Angka Luas) ---

function generateQuestion(type, level) {
    let A, B, answer, operator, operationName;
    
    const baseLevelFactor = level * 3;
    const minFactor = 2; 
    
    // Soal Penjumlahan (Pertahanan)
    if (type === 'addition') {
        operator = '+';
        operationName = 'Penjumlahan';
        const maxAdd = 25 + baseLevelFactor; 
        A = Math.floor(Math.random() * maxAdd) + 5; 
        B = Math.floor(Math.random() * maxAdd) + 5; 
        answer = A + B;
    } 
    
    // Soal Pembagian (Pemulihan)
    else if (type === 'division') {
        operator = '÷';
        operationName = 'Pembagian';
        
        B = Math.floor(Math.random() * (12 - minFactor + 1)) + minFactor; 
        
        const maxFactor = Math.min(30, 10 + baseLevelFactor); 
        const factor = Math.floor(Math.random() * (maxFactor - minFactor + 1)) + minFactor; 
        
        A = factor * B;
        answer = factor;

    } 
    
    // Soal Perkalian (Serangan)
    else { // type === 'multiplication'
        operator = '\u00D7'; // ×
        operationName = 'Perkalian';
        
        const maxA = Math.min(15, minFactor + baseLevelFactor); 
        A = Math.floor(Math.random() * (maxA - minFactor + 1)) + minFactor; 
        
        const maxB = Math.min(15, minFactor + baseLevelFactor); 
        B = Math.floor(Math.random() * (maxB - minFactor + 1)) + minFactor; 
        answer = A * B;
    }
    
    questionString = `${A} ${operator} ${B} = ?`; 
    
    currentQuestion = { questionString, answer, type, operationName };
    return currentQuestion.questionString;
}


// --- LOGIKA PERTARUNGAN ---

function startRuneChallenge(button) {
    if (currentEnemy.hp <= 0 || player.hp <= 0) return;

    let challengeType;
    const buttonText = button.textContent.trim();
    if (buttonText.includes('Perkalian')) challengeType = 'multiplication';
    else if (buttonText.includes('Penjumlahan')) challengeType = 'addition';
    else if (buttonText.includes('Pembagian')) challengeType = 'division';
    else challengeType = 'multiplication';

    currentSkill = {
        type: challengeType,
        effectBase: parseInt(button.dataset.effect),
        name: button.textContent.trim()
    };

    const questionString = generateQuestion(challengeType, player.level);

    challengeTitle.textContent = currentSkill.name.replace(/\s\(.*\)/, '') + ` (Soal: ${currentQuestion.operationName})`;
    soalMatematika.textContent = questionString;
    
    answerInput.value = '';
    
    challengeArea.style.display = 'block';
    actionPanel.style.display = 'none';
    answerInput.focus();
    updateUI(null);

    let time = CHALLENGE_TIME;
    challengeTimerElement.textContent = time;

    challengeTimer = setInterval(() => {
        time--;
        challengeTimerElement.textContent = time;

        if (time <= 0) {
            clearInterval(challengeTimer);
            checkSequenceAnswer(true); 
        }
    }, 1000);
}

function checkSequenceAnswer(isTimeOut = false) {
    if (!currentQuestion) return;
    
    clearInterval(challengeTimer);

    // ⭐ DAMAGE KARENA WAKTU HABIS (Penalty: random 5-10)
    if (isTimeOut) {
        const penalty = getRandomDamage(COUNTER_DAMAGE_MIN, COUNTER_DAMAGE_MAX); 
        player.hp -= penalty; 
        let message = `🚨 WAKTU HABIS! Jawaban benar: ${currentQuestion.answer}. Anda menerima ${penalty} *Counter Damage*.`;
        
        challengeArea.style.display = 'none';
        updateUI(message);
        
        if (player.hp > 0 && currentEnemy.hp > 0) {
            setTimeout(enemyTurn, 1500);
        }
        return; 
    }
    
    const inputString = answerInput.value.trim();
    const userInput = parseInt(inputString.split(',')[0]); 
    
    let message = "";
    
    if (userInput === currentQuestion.answer) {
        applyRuneEffect(currentSkill, 2); 
        message = `✅ Sempurna! ${currentSkill.name} diaktifkan dengan kekuatan penuh!`;
        
        if (currentEnemy.hp <= 0) {
            player.level++;
            player.hp = player.maxHp; 
        }
    } else {
        // ⭐ DAMAGE KARENA SALAH JAWAB (Counter Damage: random 5-10)
        const counterDamage = getRandomDamage(COUNTER_DAMAGE_MIN, COUNTER_DAMAGE_MAX);
        player.hp -= counterDamage; 
        message = `❌ Salah! Jawaban benar: ${currentQuestion.answer}. Anda menerima ${counterDamage} *Counter Damage*.`;
    }

    challengeArea.style.display = 'none';
    updateUI(message);
    
    if (player.hp > 0 && currentEnemy.hp > 0) {
        setTimeout(enemyTurn, 1500);
    }
}

function applyRuneEffect(skill, multiplier) {
    let effect;

    if (skill.type === 'division') { // Pemulihan (Heal)
         effect = skill.effectBase * multiplier; 
         player.hp = Math.min(player.maxHp, player.hp + effect);
         setLogMessage(logContainer.querySelector('#message').textContent + ` HP dipulihkan sebesar ${effect}.`);
    } else { // Serangan (multiplication) & Pertahanan (addition)
         // Serangan Pemain: Random 5-10 (tidak berubah)
         const baseEffect = getRandomDamage(PLAYER_ATTACK_MIN, PLAYER_ATTACK_MAX);
         effect = baseEffect * multiplier;
         
         currentEnemy.hp -= effect;
         setLogMessage(logContainer.querySelector('#message').textContent + ` Musuh menerima ${effect} kerusakan.`);
    }
}


function enemyTurn() {
    // Serangan Musuh: Random 5-8 (tidak berubah, sesuai permintaan)
    const enemyDamage = getRandomDamage(ENEMY_ATTACK_MIN, ENEMY_ATTACK_MAX);
    player.hp -= enemyDamage;
    updateUI(`Guardian menyerang balik! Anda kehilangan ${enemyDamage} HP.`);
    
    if (player.hp > 0) {
        actionPanel.style.display = 'block'; 
    }
}

function restartGame() {
    player.hp = player.maxHp;
    player.level = 1;
    currentEnemy.hp = 150; 
    
    logContainer.innerHTML = '';
    setLogMessage("Selamat datang kembali, Sequencer. Hadapi Guardian baru!");
    
    actionPanel.style.display = 'block';
    challengeArea.style.display = 'none';
    
    updateUI(null);
}

function endGame() {
    clearInterval(challengeTimer);
    actionPanel.style.display = 'none';
    challengeArea.style.display = 'none';

    if (player.hp <= 0) {
        const finalMessage = "💀 Anda dikalahkan oleh Guardian Logika! Permainan Selesai.";
        
        logContainer.innerHTML = '';
        const finalMsgElement = document.createElement('p');
        finalMsgElement.textContent = finalMessage;
        logContainer.appendChild(finalMsgElement);

        const restartButton = document.createElement('button');
        restartButton.textContent = "Mulai Lagi";
        restartButton.onclick = restartGame;
        restartButton.classList.add('rune-button', 'attack-rune'); 
        logContainer.appendChild(restartButton);

    } else {
        setLogMessage("🏆 KEMENANGAN! Anda berhasil menguasai Rune!");
    }
}


// --- INISIALISASI ---
document.addEventListener('DOMContentLoaded', () => {
    updateUI("Selamat datang, Sequencer. Hadapi Guardian!");
});