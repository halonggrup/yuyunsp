document.addEventListener('DOMContentLoaded', () => {
    const MAX_HP = 10;
    const TIME_PER_QUESTION = 10.0;

    let currentAnswer;
    let playerHP = MAX_HP;
    let enemyHP = MAX_HP;
    let gameActive = false;
    let timeLeft = TIME_PER_QUESTION;
    let timerInterval;

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

    const startTimer = () => {
        clearInterval(timerInterval);
        timeLeft = TIME_PER_QUESTION;
        DOM.timeLeftElement.textContent = timeLeft.toFixed(1);

        timerInterval = setInterval(() => {
            if (!gameActive) { clearInterval(timerInterval); return; }
            timeLeft -= 0.1;
            timeLeft = Math.max(0, timeLeft);
            DOM.timeLeftElement.textContent = timeLeft.toFixed(1);
            if (timeLeft <= 0) { clearInterval(timerInterval); checkAnswer(true); }
        }, 100);
    };

    const updateHPDisplay = () => {
        DOM.playerHPBar.value = playerHP;
        DOM.playerHPText.textContent = `${playerHP}/${MAX_HP}`;
        DOM.enemyHPBar.value = enemyHP;
        DOM.enemyHPText.textContent = `${enemyHP}/${MAX_HP}`;
        if(playerHP <= 0) endGame('defeat');
        if(enemyHP <= 0) endGame('win');
    };

    const startGame = () => {
        playerHP = MAX_HP; enemyHP = MAX_HP; gameActive = true;
        DOM.startBtn.classList.add('hidden');
        DOM.answerInput.classList.remove('hidden');
        DOM.submitBtn.classList.remove('hidden');
        DOM.messageElement.classList.add('hidden');
        DOM.answerInput.disabled=false; DOM.submitBtn.disabled=false;
        DOM.fireballElement.className=''; DOM.fireballElement.style.opacity='0';
        updateHPDisplay();
        generateVectorABQuestion();
    };

    const endGame = (result) => {
        clearInterval(timerInterval); gameActive=false;
        DOM.answerInput.disabled=true; DOM.submitBtn.disabled=true;
        DOM.timeLeftElement.textContent='0.0';
        DOM.fireballElement.className=''; DOM.fireballElement.style.opacity='0';
        showMessage(result==='win'?'KEMENANGAN! Naga Dikalahkan! 🏆':'KEKALAHAN! HP Anda Habis! 💀',result==='win'?'correct':'incorrect');
        DOM.startBtn.textContent='Mulai Duel Baru!'; DOM.startBtn.classList.remove('hidden');
    };

    const animateHit = (targetElement) => {
        if(!gameActive) return;
        targetElement.classList.add('shake');
        setTimeout(()=>targetElement.classList.remove('shake'),500);
    };

    const performAttack = (attacker,target,isSuccessful)=>{
        if(!gameActive) return;
        attacker.classList.add('attack');
        DOM.fireballElement.className=''; DOM.fireballElement.style.opacity='0'; DOM.fireballElement.style.transform='translateX(0)';
        void DOM.fireballElement.offsetWidth;
        if(isSuccessful){
            const startClass = attacker===DOM.playerWizardElement?'fireball-player-start':'fireball-enemy-start';
            const finishClass = attacker===DOM.playerWizardElement?'fireball-player-finish':'fireball-enemy-finish';
            DOM.fireballElement.classList.add(startClass);
            setTimeout(()=>{
                DOM.fireballElement.classList.remove(startClass);
                DOM.fireballElement.classList.add(finishClass);
                setTimeout(()=>{
                    animateHit(target);
                    DOM.fireballElement.className=''; DOM.fireballElement.style.opacity='0'; DOM.fireballElement.style.transform='translateX(0)';
                },400);
            },400);
        } else {
            setTimeout(()=>animateHit(target),500);
        }
        setTimeout(()=>attacker.classList.remove('attack'),300);
    };

    const generateVectorABQuestion = () => {
        if(!gameActive) return;
        const Ax = Math.floor(Math.random()*10)+1;
        const Ay = Math.floor(Math.random()*10)+1;
        const Bx = Math.floor(Math.random()*10)+1;
        const By = Math.floor(Math.random()*10)+1;
        currentAnswer = `${Bx-Ax},${By-Ay}`;
        DOM.questionArea.textContent = `Tentukan vektor AB\nB=(${Bx},${By})\nA=(${Ax},${Ay})`;
        DOM.answerInput.value=''; DOM.answerInput.focus();
        startTimer();
    };

    const checkAnswer=(timeIsUp=false)=>{
        if(!gameActive) return; clearInterval(timerInterval);
        const userAnswer = DOM.answerInput.value.trim();
        if(userAnswer==='') { if(!timeIsUp){ showMessage('Masukkan jawaban!','incorrect'); startTimer(); return; } }
        DOM.answerInput.disabled=true; DOM.submitBtn.disabled=true;
        let attacker,target,success;
        if(userAnswer===currentAnswer && !timeIsUp){ enemyHP--; showMessage('MANTRA BERHASIL! Naga Terkena! 💥','correct'); attacker=DOM.playerWizardElement; target=DOM.enemyWizardElement; success=true; }
        else { playerHP--; attacker=DOM.enemyWizardElement; target=DOM.playerWizardElement; success=true; showMessage(timeIsUp?`WAKTU HABIS! Jawaban benar: ${currentAnswer}. Anda Terkena! 💀`:`MANTRA GAGAL! Jawaban benar: ${currentAnswer}. Anda Terkena! 🤕`,'incorrect'); }
        performAttack(attacker,target,success);
        updateHPDisplay();
        setTimeout(()=>{if(gameActive){generateVectorABQuestion(); DOM.answerInput.disabled=false; DOM.submitBtn.disabled=false;}},1200);
    };

    const showMessage=(text,type)=>{DOM.messageElement.textContent=text; DOM.messageElement.className=''; DOM.messageElement.classList.add(type); DOM.messageElement.classList.remove('hidden');};

    DOM.answerInput.classList.add('hidden'); DOM.submitBtn.classList.add('hidden');
    DOM.startBtn.addEventListener('click',startGame);
    DOM.submitBtn.addEventListener('click',()=>checkAnswer(false));
    DOM.answerInput.addEventListener('keypress',(e)=>{if(e.key==='Enter') checkAnswer(false);});
    updateHPDisplay();
});
