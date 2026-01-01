const API_URL = "https://spokely-backend-1.onrender.com";
const USER_ID = "81d8e5b7-edb2-4227-9fb2-8d4863b51414"; // SEU ID

// Função Global: Atualiza o Header (Vidas e XP)
async function updateHeader() {
    try {
        const res = await fetch(`${API_URL}/get-profile?user_id=${USER_ID}`);
        const data = await res.json();
        
        if (data.xp !== undefined) {
            // Se tiver elementos na tela, atualiza
            const elLives = document.getElementById('livesDisplay');
            const elXp = document.getElementById('xpDisplay');
            if(elLives) elLives.innerText = data.lives;
            if(elXp) elXp.innerText = data.xp;
            
            // Retorna dados pro uso da página específica
            return data;
        }
    } catch (e) { console.error("Erro API:", e); }
    return null;
}

// Função Global: Perder Vida
async function apiLoseLife() {
    try {
        const res = await fetch(`${API_URL}/lose-life`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ user_id: USER_ID })
        });
        const data = await res.json();
        if(data.success) {
            document.getElementById('livesDisplay').innerText = data.lives;
            return data.lives;
        }
    } catch(e) { console.error(e); }
}

// Inicializa header em todas as páginas
window.addEventListener('load', () => {
    updateHeader().then(() => {
        const loadScreen = document.getElementById('loading');
        if(loadScreen) loadScreen.style.display = 'none';
    });
});
