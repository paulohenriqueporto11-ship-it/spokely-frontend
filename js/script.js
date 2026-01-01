// js/script.js

// NOTA: NÃO declaramos API_URL nem USER_ID aqui.
// Elas já vêm do arquivo config.js que carregamos antes.

// Função Global: Atualiza o Header (Vidas e XP)
async function updateHeader() {
    try {
        // Usa a API_URL que veio do config.js
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
            const elLives = document.getElementById('livesDisplay');
            if(elLives) elLives.innerText = data.lives;
            return data.lives;
        }
    } catch(e) { console.error(e); }
}

// Inicializa header em todas as páginas automaticamente
window.addEventListener('load', () => {
    updateHeader().then(() => {
        const loadScreen = document.getElementById('loading');
        if(loadScreen) loadScreen.style.display = 'none';
    });
});
