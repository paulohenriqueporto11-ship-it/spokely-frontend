const API_URL = "https://spokely-backend-1.onrender.com";
const USER_ID = "81d8e5b7-edb2-4227-9fb2-8d4863b51414"; // Seu ID

// --- ESTADO LOCAL ---
let state = { level: 1, xp: 0, lives: 5 };
let session = { correct: 0, goal: 5, active: false };
const MAX_MAP_LEVELS = 100;

// --- BANCO DE QUESTÕES (30 Perguntas Variadas) ---
const questionBank = [
    { t: "Traduza: 'Water'", o: ["Fogo", "Terra", "Água", "Ar"], c: 2 },
    { t: "Verbo 'To Be' (She)", o: ["Is", "Are", "Am", "Be"], c: 0 },
    { t: "Cor 'Red'", o: ["Azul", "Vermelho", "Verde", "Preto"], c: 1 },
    { t: "Traduza: 'Dog'", o: ["Gato", "Pássaro", "Peixe", "Cachorro"], c: 3 },
    { t: "Oposto de 'Big'", o: ["Small", "Large", "Huge", "Giant"], c: 0 },
    { t: "Passado de 'Go'", o: ["Gone", "Goed", "Went", "Gowing"], c: 2 },
    { t: "Traduza: 'Book'", o: ["Livro", "Mesa", "Caneta", "Papel"], c: 0 },
    { t: "Complete: I ___ happy", o: ["is", "am", "are", "be"], c: 1 },
    { t: "Traduza: 'Chicken'", o: ["Vaca", "Porco", "Frango", "Peixe"], c: 2 },
    { t: "Número 20 em inglês", o: ["Twelve", "Twenty", "Two", "Ten"], c: 1 },
    { t: "O que é 'Breakfast'?", o: ["Almoço", "Jantar", "Café da Manhã", "Lanche"], c: 2 },
    { t: "Complete: They ___ playing.", o: ["is", "am", "are", "was"], c: 2 },
    { t: "Traduza: 'Good Night'", o: ["Bom dia", "Boa tarde", "Boa noite", "Olá"], c: 2 },
    { t: "Como diz 'Obrigado'?", o: ["Please", "Sorry", "Excuse me", "Thanks"], c: 3 },
    { t: "Cor 'Yellow'", o: ["Roxo", "Amarelo", "Laranja", "Rosa"], c: 1 },
    { t: "Verbo 'Eat' (Comer)", o: ["Beber", "Dormir", "Comer", "Correr"], c: 2 },
    { t: "Traduza: 'Milk'", o: ["Suco", "Água", "Leite", "Refrigerante"], c: 2 },
    { t: "Complete: We ___ friends.", o: ["am", "is", "are", "be"], c: 2 },
    { t: "Oposto de 'Hot'", o: ["Cold", "Warm", "Sunny", "Dry"], c: 0 },
    { t: "Traduza: 'Brother'", o: ["Pai", "Mãe", "Irmão", "Irmã"], c: 2 },
    { t: "Dia 'Sunday'", o: ["Segunda", "Sábado", "Domingo", "Sexta"], c: 2 },
    { t: "Passado de 'See'", o: ["Saw", "Seen", "Seed", "Seeing"], c: 0 },
    { t: "Traduza: 'Money'", o: ["Dinheiro", "Tempo", "Amor", "Trabalho"], c: 0 },
    { t: "O que é 'Airport'?", o: ["Porto", "Aeroporto", "Estação", "Ponto"], c: 1 },
    { t: "Complete: He ___ a car.", o: ["have", "has", "haves", "had"], c: 1 }
];

// --- INIT ---
window.onload = async () => {
    await fetchProfile();
    renderMap();
    document.getElementById('loading').style.display = 'none';
    setTimeout(scrollToLevel, 500);
};

// --- API FUNCTIONS ---
async function fetchProfile() {
    try {
        const res = await fetch(`${API_URL}/get-profile?user_id=${USER_ID}`);
        const data = await res.json();
        if(data.current_level) {
            state.level = data.current_level; // Usa a coluna certa do banco
            state.xp = data.xp;
            state.lives = data.lives;
            updateUI();
        }
    } catch(e) { console.error("Erro perfil", e); }
}

async function apiCompleteLevel() {
    try {
        const res = await fetch(`${API_URL}/complete-level`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ user_id: USER_ID, xp_reward: 50 })
        });
        const data = await res.json();
        if(data.success) {
            state.level = data.new_level;
            state.xp = data.current_xp;
            return true;
        }
    } catch(e) { console.error(e); }
    return false;
}

async function apiLoseLife() {
    try {
        const res = await fetch(`${API_URL}/lose-life`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ user_id: USER_ID })
        });
        const data = await res.json();
        if(data.success) state.lives = data.lives;
        updateUI();
    } catch(e) { console.error(e); }
}

// --- MAPA ---
function renderMap() {
    const track = document.getElementById('mapTrack');
    track.innerHTML = ''; // Limpa

    for (let i = 1; i <= MAX_MAP_LEVELS; i++) {
        const node = document.createElement('div');
        node.className = 'node';
        node.innerText = i;
        
        if (i < state.level) {
            node.classList.add('done');
            node.innerText = '✓';
        } else if (i === state.level) {
            node.classList.add('curr');
            const avatar = document.createElement('div');
            avatar.className = 'avatar';
            node.appendChild(avatar);
            node.onclick = () => startSession();
        } else {
            node.classList.add('locked');
            node.innerHTML = '<span class="material-icons-round">lock</span>';
        }
        track.appendChild(node);
    }
}

function scrollToLevel() {
    const el = document.querySelector('.node.curr');
    if(el) el.scrollIntoView({ inline: 'center', behavior: 'smooth' });
}

// --- GAME LOGIC ---
function startSession() {
    if(state.lives <= 0) return alert("Sem vidas! 💔");
    
    session.correct = 0;
    session.active = true;
    updateProgressBar();
    
    document.getElementById('overlay-quiz').style.display = 'flex';
    nextQuestion();
}

function nextQuestion() {
    const q = questionBank[Math.floor(Math.random() * questionBank.length)];
    document.getElementById('qQuestion').innerText = q.t;
    const opts = document.getElementById('qOptions');
    opts.innerHTML = '';

    q.o.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'btn-opt';
        btn.innerText = opt;
        btn.onclick = () => handleAnswer(idx, q.c, btn);
        opts.appendChild(btn);
    });
}

async function handleAnswer(sel, cor, btn) {
    const all = document.querySelectorAll('.btn-opt');
    all.forEach(b => b.disabled = true);

    if(sel === cor) {
        btn.classList.add('correct');
        session.correct++;
        updateProgressBar();
        
        setTimeout(async () => {
            if(session.correct >= session.goal) {
                // GANHOU O NÍVEL
                const success = await apiCompleteLevel();
                if(success) {
                    renderMap();
                    updateUI();
                    document.getElementById('overlay-quiz').style.display = 'none';
                    alert(`NÍVEL ${state.level-1} COMPLETADO! 🎉`);
                    scrollToLevel();
                }
            } else {
                nextQuestion();
            }
        }, 1000);
    } else {
        btn.classList.add('wrong');
        // Acha a correta
        // all[cor].classList.add('correct');
        await apiLoseLife();
        
        setTimeout(() => {
            if(state.lives <= 0) {
                document.getElementById('overlay-quiz').style.display = 'none';
                alert("Game Over! Sem vidas.");
            } else {
                nextQuestion(); // Pula pra outra ou repete
            }
        }, 1500);
    }
}

function updateProgressBar() {
    const pct = (session.correct / session.goal) * 100;
    document.getElementById('lessonProgress').style.width = `${pct}%`;
    document.getElementById('quizLives').innerText = "❤".repeat(state.lives);
}

async function quitQuiz() {
    if(confirm("Sair agora gasta 1 vida. Confirmar?")) {
        await apiLoseLife();
        document.getElementById('overlay-quiz').style.display = 'none';
    }
}

// --- NAV & UI ---
function navTo(areaId, btn) {
    document.querySelectorAll('section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(`area-${areaId}`).classList.add('active');
    if(btn) btn.classList.add('active');
    else document.querySelectorAll('.nav-btn')[1].classList.add('active'); // Default map

    if(areaId === 'map') setTimeout(scrollToLevel, 300);
}

function updateUI() {
    document.getElementById('livesDisplay').innerText = state.lives;
    document.getElementById('xpDisplay').innerText = state.xp;
    document.getElementById('lvlDisplay').innerText = state.level;
    document.getElementById('nextLevelNum').innerText = state.level;
    document.getElementById('totalXpProfile').innerText = state.xp;
}
