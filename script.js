const API_URL = "https://spokely-backend-1.onrender.com";
const USER_ID = "81d8e5b7-edb2-4227-9fb2-8d4863b51414"; // <--- SEU ID

// --- DADOS LOCAIS ---
let userData = {
    level: 1,
    xp: 0,
    lives: 5
};
const TOTAL_LEVELS = 50;

// --- ELEMENTOS ---
const mapTrack = document.getElementById('mapTrack');
const quizOverlay = document.getElementById('quiz-overlay');
const livesDisplay = document.getElementById('livesDisplay');
const xpDisplay = document.getElementById('xpDisplay');
const lvlDisplay = document.getElementById('lvlDisplay');

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
    } catch (e) { console.error("Erro load:", e); }
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
    } catch (e) { console.error("Erro life:", e); }
}

async function sendProgress(xpAmount) {
    try {
        const res = await fetch(`${API_URL}/add-xp`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ user_id: USER_ID, xp_amount: xpAmount }) 
        });
        const data = await res.json();
        if(data.success) {
            userData.level = data.new_level;
            userData.xp = data.current_xp;
            
            // ATUALIZA TUDO E FECHA
            updateUI();
            renderMap();
            closeQuiz(); 
            
            alert(`Nível Concluído! +${xpAmount} XP`);
            setTimeout(scrollToCurrentLevel, 500);
        }
    } catch(e) { console.error("Erro xp:", e); }
}

// --- MAPA ---
function renderMap() {
    // Recria o mapa do zero para garantir atualização
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
            node.onclick = () => openQuiz(i);
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

// --- QUIZ ---
const questions = [
    { t: "Traduza 'House'", o: ["Carro", "Casa", "Rua", "Prédio"], c: 1 },
    { t: "Verbo 'To Be' (Eu)", o: ["Is", "Are", "Am", "Be"], c: 2 },
    { t: "Cor 'Blue'", o: ["Azul", "Vermelho", "Verde", "Preto"], c: 0 }
];

function openQuiz(level) {
    if(userData.lives <= 0) {
        alert("Sem vidas! Espere recarregar.");
        return;
    }
    quizOverlay.style.display = 'flex';
    
    // Sorteia pergunta simples
    const q = questions[Math.floor(Math.random() * questions.length)];
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
    all.forEach(b => b.disabled = true);

    if (selected === correct) {
        btn.classList.add('correct');
        // Espera 1seg e processa vitoria
        setTimeout(() => sendProgress(25), 1000);
    } else {
        btn.classList.add('wrong');
        await loseLifeAPI();
        alert("Errou! -1 Vida 💔");
        setTimeout(closeQuiz, 1000); // Fecha modal após errar
    }
}

async function exitQuiz() {
    if(confirm("Desistir custa 1 vida. Certeza?")) {
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
    document.getElementById('livesInQuiz').innerText = "❤".repeat(userData.lives);
}

function switchScreen(name, el) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById(`screen-${name}`).classList.add('active');
    el.classList.add('active');
    if(name === 'map') scrollToCurrentLevel();
}
