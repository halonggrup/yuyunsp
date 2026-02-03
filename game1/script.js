document.addEventListener('DOMContentLoaded', () => {
    // --- VARIABEL KONSTANTA ---
    const MAX_HP = 10;
    const TIME_PER_QUESTION = 10.0;
    
    // --- VARIABEL STATUS GAME ---
    let currentAnswer;
    let playerHP = MAX_HP;
    let enemyHP = MAX_HP;
    let gameActive = false;
    let timeLeft = TIME_PER_QUESTION;
    let timerInterval;

    // --- REFERENSI DOM ---
    const DOM = {
        questionArea: document.getElementById('question-area'),
        answerInput: document.getElementById('answer-input'),
        submitBtn: document.getElementById('submit-btn'),
        messageElement: document.getElementById('message'),
        startBtn: document.getElementById('start-btn'),
        playerWizardElement: document.getElementById('player-wizard'),
        enemyWizardElement: document.getElementById('enemy-wizard'),
        fireballElement: document.getElementById('fireball'),
        playerHPBar: document.getElementById('player-hp-bar'),
        playerHPText: document.getElementById('player-hp-text'),
        enemyHPBar: document.getElementById('enemy-hp-bar'),
        enemyHPText: document.getElementById('enemy-hp-text'),
        timeLeftElement: document.getElementById('time-left')
    };

    // --- FUNGSI TIMER ---
    const startTimer = () => {
        clearInterval(timerInterval);
        timeLeft = TIME_PER_QUESTION;
        DOM.timeLeftElement.textContent = timeLeft.toFixed(1);

        timerInterval = setInterval(() => {
            if (!gameActive) {
                clearInterval(timerInterval);
                return;
            }

            timeLeft -= 0.1;
            timeLeft = Math.max(0, timeLeft); 
            DOM.timeLeftElement.textContent = timeLeft.toFixed(1);

            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                checkAnswer(true); // Waktu Habis
            }
        }, 100);
    };

    // --- FUNGSI UTAMA GAME ---
    const updateHPDisplay = () => {
        DOM.playerHPBar.value = playerHP;
        DOM.playerHPText.textContent = `${playerHP}/${MAX_HP}`;
        
        DOM.enemyHPBar.value = enemyHP;
        DOM.enemyHPText.textContent = `${enemyHP}/${MAX_HP}`;

        if (playerHP <= 0) {
            endGame('defeat');
        } else if (enemyHP <= 0) {
            endGame('win');
        }
    };

    const startGame = () => {
        playerHP = MAX_HP;
        enemyHP = MAX_HP;
        gameActive = true;

        DOM.startBtn.classList.add('hidden');
        DOM.answerInput.classList.remove('hidden');
        DOM.submitBtn.classList.remove('hidden');
        DOM.messageElement.classList.add('hidden');
        DOM.answerInput.disabled = false;
        DOM.submitBtn.disabled = false;
        
        // Reset Fireball
        DOM.fireballElement.classList.remove(
            'fireball-player-start', 
            'fireball-player-finish', 
            'fireball-enemy-start', 
            'fireball-enemy-finish'
        );
        DOM.fireballElement.style.opacity = '0';

        updateHPDisplay();
        generateQuestion();
    };

    const endGame = (result) => {
        clearInterval(timerInterval);
        gameActive = false;
        DOM.answerInput.disabled = true;
        DOM.submitBtn.disabled = true;
        DOM.timeLeftElement.textContent = '0.0';
        
        // Reset Fireball
        DOM.fireballElement.classList.remove(
            'fireball-player-start', 
            'fireball-player-finish', 
            'fireball-enemy-start', 
            'fireball-enemy-finish'
        );
        DOM.fireballElement.style.opacity = '0';
        
        if (result === 'win') {
            showMessage('KEMENANGAN! Penyihir Lawan Dikalahkan! 🏆', 'correct');
        } else {
            showMessage('KEKALAHAN! HP Anda Habis! Coba Lagi. 💀', 'incorrect');
        }
        
        DOM.startBtn.textContent = 'Mulai Duel Baru!';
        DOM.startBtn.classList.remove('hidden');
    };

    // --- FUNGSI ANIMASI ---
    const animateHit = (targetElement) => {
        if (!gameActive) return; 
        targetElement.classList.add('shake');
        setTimeout(() => {
            targetElement.classList.remove('shake');
        }, 500); 
    };

    /**
     * Mengatur animasi serangan sihir dua tahap (Attack Move Wizard + Fireball Move/Hit).
     * Menggunakan setTimeout untuk stabilitas timing.
     */
    const performAttack = (attackerElement, targetElement, isSuccessful) => {
        if (!gameActive) return;

        // 1. Wizard 'Mengambil Jarak' (Attack Move)
        attackerElement.classList.add('attack'); 

        const isPlayerAttacking = attackerElement === DOM.playerWizardElement;
        
        // Reset Fireball
        DOM.fireballElement.classList.remove(
            'fireball-player-start', 
            'fireball-player-finish', 
            'fireball-enemy-start', 
            'fireball-enemy-finish'
        );
        DOM.fireballElement.style.opacity = '0';
        DOM.fireballElement.style.transform = 'translateX(0)';

        // Memicu reflow/render ulang
        void DOM.fireballElement.offsetWidth;
        
        let startClass, finishClass, hitDelay;

        if (isSuccessful) {
            // Serangan Berhasil (Fireball diluncurkan dari sisi attacker)
            hitDelay = 800; // Total durasi 0.4s + 0.4s
            
            if (isPlayerAttacking) {
                // Pemain Menyerang Musuh (Kiri ke Kanan)
                startClass = 'fireball-player-start';
                finishClass = 'fireball-player-finish';
            } else {
                // Musuh Menyerang Pemain (Kanan ke Kiri)
                startClass = 'fireball-enemy-start';
                finishClass = 'fireball-enemy-finish';
            }
            
            // Mulai Animasi Stage 1
            DOM.fireballElement.classList.add(startClass);
            
            // Transisi ke Stage 2 setelah 400ms
            setTimeout(() => {
                if (!gameActive) return;
                DOM.fireballElement.classList.remove(startClass);
                DOM.fireballElement.classList.add(finishClass);
                
                // Fireball Mengenai Target setelah 400ms lagi
                setTimeout(() => {
                    if (!gameActive) return;
                    animateHit(targetElement); 
                    
                    // Reset visual fireball
                    DOM.fireballElement.classList.remove(finishClass);
                    DOM.fireballElement.style.opacity = '0'; 
                    DOM.fireballElement.style.transform = 'translateX(0)';
                    
                }, 400); 
                
            }, 400); 

        } else {
            // Serangan Gagal (Musuh menyerang balik atau waktu habis, tanpa fireball)
            hitDelay = 500; 
            
            setTimeout(() => {
                animateHit(targetElement); 
            }, hitDelay); 
        }
        
        // Wizard Selesai Mengambil Jarak
        setTimeout(() => {
            attackerElement.classList.remove('attack');
        }, 300); // Sesuai durasi CSS .attack
    };


    // --- FUNGSI SOAL DAN JAWABAN ---

    const generateQuestion = () => {
        if (!gameActive) return;

        const num1 = Math.floor(Math.random() * 50) + 1;
        const num2 = Math.floor(Math.random() * 50) + 1;
        
        currentAnswer = num1 + num2;
        DOM.questionArea.textContent = `${num1} + ${num2} = ?`;
        
        DOM.answerInput.value = '';
        DOM.answerInput.focus();
        
        startTimer(); 
    };

    const checkAnswer = (timeIsUp = false) => {
        if (!gameActive) return;

        clearInterval(timerInterval);
        
        const userAnswer = parseInt(DOM.answerInput.value);
        
        if (isNaN(userAnswer) && !timeIsUp) {
            showMessage('Masukkan angka!', 'incorrect');
            startTimer();
            return;
        }
        
        DOM.answerInput.disabled = true;
        DOM.submitBtn.disabled = true;
        
        let attacker, target, success;

        if (userAnswer === currentAnswer && !timeIsUp) {
            // Player Attack: Jawaban Benar
            enemyHP--;
            showMessage('MANTRA BERHASIL! Lawan Terkena Serangan! 💥', 'correct');
            attacker = DOM.playerWizardElement;
            target = DOM.enemyWizardElement;
            success = true; 
        } else {
            // Enemy Attack: Jawaban Salah atau Waktu Habis
            playerHP--;
            if (timeIsUp) {
                showMessage(`WAKTU HABIS! Jawaban benar: ${currentAnswer}. Anda Terkena Serangan! 💀`, 'incorrect');
            } else {
                showMessage(`MANTRA GAGAL! Jawaban benar: ${currentAnswer}. Anda Terkena Serangan! 🤕`, 'incorrect');
            }
            attacker = DOM.enemyWizardElement; 
            target = DOM.playerWizardElement;
            success = true; // Musuh berhasil menyerang balik!
        }
        
        performAttack(attacker, target, success);
        updateHPDisplay();

        // Tunggu hingga semua animasi selesai
        setTimeout(() => {
            if (gameActive) {
                generateQuestion();
                DOM.answerInput.disabled = false;
                DOM.submitBtn.disabled = false;
            }
        }, 1200); 
    };

    const showMessage = (text, type) => {
        DOM.messageElement.textContent = text;
        DOM.messageElement.className = ''; 
        DOM.messageElement.classList.add(type);
        DOM.messageElement.classList.remove('hidden');
    };

    // --- INISIALISASI DAN EVENT LISTENERS ---

    // Sembunyikan input dan submit saat start
    DOM.answerInput.classList.add('hidden');
    DOM.submitBtn.classList.add('hidden');

    DOM.startBtn.addEventListener('click', startGame);
    DOM.submitBtn.addEventListener('click', () => checkAnswer(false));

    DOM.answerInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            checkAnswer(false);
        }
    });

    updateHPDisplay();
});