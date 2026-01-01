const API_URL = "https://spokely-backend-1.onrender.com";
const USER_ID = "81d8e5b7-edb2-4227-9fb2-8d4863b51414"; // <--- SEU ID AQUI

// --- DADOS LOCAIS ---
let userData = { level: 1, xp: 0, lives: 5 };
const TOTAL_LEVELS = 50; // Total de fases no mapa

// --- CONTROLE DA SESSÃO (AULA) ---
let sessionProgress = 0; // Quantas acertei agora
const GOAL_QUESTIONS = 5; // Precisa acertar 5 pra passar de nível

// --- ELEMENTOS ---
const mapTrack = document.getElementById('mapTrack');
const quizOverlay = document.getElementById('quiz-overlay');
const livesDisplay = document.getElementById('livesDisplay');
const xpDisplay = document.getElementById('xpDisplay');
const lvlDisplay = document.getElementById('lvlDisplay');
const lessonBar = document.getElementById('lessonBar');

// --- INICIALIZAÇÃO ---
window.onload = async () => {
    await loadProfile();
    renderMap();
    document.getElementById('loading').style.display = 'none';
    setTimeout(scrollToCurrentLevel, 500);
};

// --- API ---
async function loadProfile() {
    try {
        const res = await fetch(`${API_URL}/get-profile?user_id=${USER_ID}`);
        const data = await res.json();
        if (data.level) {
            userData = data;
            updateUI();
        }
    } catch (e) { console.error(e); }
}

async function loseLifeAPI() {
    try {
        const res = await fetch(`${API_URL}/lose-life`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ user_id: USER_ID }) 
        });
        const data = await res.json();
        if(data.success) {
            userData.lives = data.lives;
            updateUI();
        }
    } catch (e) { console.error(e); }
}

async function finishLevel() {
    // Só chama quando completar as 5 perguntas
    try {
        // 50 XP por lição completa
        const res = await fetch(`${API_URL}/add-xp`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ user_id: USER_ID, xp_amount: 50 }) 
        });
        const data = await res.json();
        if(data.success) {
            userData.level = data.new_level;
            userData.xp = data.current_xp;
            
            updateUI();
            renderMap();
            closeQuiz(); 
            
            alert(`LIÇÃO CONCLUÍDA! 🎉\n+50 XP`);
            setTimeout(scrollToCurrentLevel, 500);
        }
    } catch(e) { console.error(e); }
}

// --- MAPA ---
function renderMap() {
    mapTrack.innerHTML = '<div class="map-line"></div>';
    for (let i = 1; i <= TOTAL_LEVELS; i++) {
        const node = document.createElement('div');
        node.className = 'level-node';
        node.innerText = i;
        
        if (i < userData.level) {
            node.classList.add('completed');
            node.innerHTML = '<span class="material-icons-round">check</span>';
        } else if (i === userData.level) {
            node.classList.add('current');
            const avatar = document.createElement('div');
            avatar.className = 'avatar-marker';
            node.appendChild(avatar);
            node.onclick = () => startSession(i);
        } else {
            node.classList.add('locked');
            node.innerHTML = '<span class="material-icons-round">lock</span>';
        }
        mapTrack.appendChild(node);
    }
}

function scrollToCurrentLevel() {
    const current = document.querySelector('.level-node.current');
    if(current) current.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'center' });
}

// --- QUIZ SESSION ---
const questionsBank = [
    { t: "Traduza 'House'", o: ["Carro", "Casa", "Rua", "Prédio"], c: 1 },
    { t: "Verbo 'To Be' (Eu)", o: ["Is", "Are", "Am", "Be"], c: 2 },
    { t: "Cor 'Blue'", o: ["Azul", "Vermelho", "Verde", "Preto"], c: 0 },
    { t: "Traduza 'Dog'", o: ["Gato", "Pássaro", "Peixe", "Cachorro"], c: 3 },
    { t: "Oposto de 'Happy'", o: ["Sad", "Good", "Nice", "Angry"], c: 0 },
    { t: "Passado de 'Go'", o: ["Gone", "Goed", "Went", "Gowing"], c: 2 },
    { t: "Traduza 'Book'", o: ["Livro", "Mesa", "Caneta", "Papel"], c: 0 }
];

function startSession(level) {
    if(userData.lives <= 0) {
        alert("Você está sem vidas! 💔\nEspere recarregar ou compre mais.");
        return;
    }
    
    // Reseta progresso da aula
    sessionProgress = 0;
    updateSessionBar();
    
    quizOverlay.style.display = 'flex';
    loadNextQuestion();
}

function loadNextQuestion() {
    // Sorteia uma pergunta
    const q = questionsBank[Math.floor(Math.random() * questionsBank.length)];
    
    document.getElementById('qText').innerText = q.t;
    const opts = document.getElementById('qOptions');
    opts.innerHTML = '';
    
    q.o.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'btn-opt';
        btn.innerText = opt;
        btn.onclick = () => checkAnswer(idx, q.c, btn);
        opts.appendChild(btn);
    });
}

async function checkAnswer(selected, correct, btn) {
    const all = document.querySelectorAll('.btn-opt');
    all.forEach(b => b.disabled = true); // Trava cliques

    if (selected === correct) {
        // ACERTOU
        btn.classList.add('correct');
        sessionProgress++;
        updateSessionBar();

        setTimeout(() => {
            if (sessionProgress >= GOAL_QUESTIONS) {
                // Terminou a lição!
                finishLevel();
            } else {
                // Próxima pergunta
                loadNextQuestion();
            }
        }, 1000);

    } else {
        // ERROU
        btn.classList.add('wrong');
        
        // Atualiza UI localmente pra ser rápido
        userData.lives--; 
        updateUI();
        
        // Avisa backend
        loseLifeAPI(); 
        
        alert("Errou! -1 Vida 💔");

        if (userData.lives <= 0) {
            closeQuiz();
            alert("Game Over! Suas vidas acabaram.");
        } else {
            // Recarrega OUTRA pergunta (ou a mesma)
            setTimeout(loadNextQuestion, 1000);
        }
    }
}

function updateSessionBar() {
    const pct = (sessionProgress / GOAL_QUESTIONS) * 100;
    lessonBar.style.width = `${pct}%`;
}

async function exitQuiz() {
    if(confirm("Sair da lição? Você perderá 1 vida!")) {
        userData.lives--;
        updateUI();
        await loseLifeAPI();
        closeQuiz();
    }
}

function closeQuiz() {
    quizOverlay.style.display = 'none';
}

// --- UI UTILS ---
function updateUI() {
    livesDisplay.innerText = userData.lives;
    xpDisplay.innerText = userData.xp;
    lvlDisplay.innerText = userData.level;
    document.getElementById('livesInQuiz').innerText = "❤".repeat(userData.lives > 0 ? userData.lives : 0);
}

function switchScreen(name, el) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById(`screen-${name}`).classList.add('active');
    el.classList.add('active');
    if(name === 'map') scrollToCurrentLevel();
}
