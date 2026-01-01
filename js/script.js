// js/script.js

// Verifica se o config.js carregou corretamente antes de tentar qualquer coisa
if (typeof API_URL === 'undefined' || typeof USER_ID === 'undefined') {
    console.error("ERRO CRÍTICO: config.js não foi carregado ou variáveis estão faltando.");
}

// Função Global: Atualiza o Header (Vidas e XP)
// Quem chama essa função é o arquivo HTML de cada página (map.html, index.html)
async function updateHeader() {
    try {
        if (typeof API_URL === 'undefined') return null;

        // Faz a chamada ao Backend
        const res = await fetch(`${API_URL}/get-profile?user_id=${USER_ID}`);
        
        // Se o servidor der erro (503, 500, 404), tratamos aqui para não quebrar o JS
        if (!res.ok) {
            console.error(`Erro no Servidor: ${res.status} - ${res.statusText}`);
            return null;
        }

        const data = await res.json();
        
        if (data && data.xp !== undefined) {
            // Atualiza a tela se os elementos existirem
            const elLives = document.getElementById('livesDisplay');
            const elXp = document.getElementById('xpDisplay');
            
            if(elLives) elLives.innerText = data.lives;
            if(elXp) elXp.innerText = data.xp;
            
            return data;
        }
    } catch (e) { 
        // Esse erro geralmente é CORS ou Servidor Offline (Failed to fetch)
        console.error("Erro de Conexão (API Offline ou Bloqueada):", e); 
    }
    return null;
}

// Função Global: Perder Vida
async function apiLoseLife() {
    try {
        if (typeof API_URL === 'undefined') return;

        const res = await fetch(`${API_URL}/lose-life`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ user_id: USER_ID })
        });
        
        if (!res.ok) throw new Error("Falha ao descontar vida");

        const data = await res.json();
        if(data.success) {
            const elLives = document.getElementById('livesDisplay');
            if(elLives) elLives.innerText = data.lives;
            return data.lives;
        }
    } catch(e) { 
        console.error("Erro ao perder vida:", e); 
    }
}

// REMOVIDO: window.addEventListener('load'...)
// Deixamos o controle de carregamento para cada página individual (map.html)
