// URL oficial do Google Apps Script conectada ao banco de dados
const API_URL = "https://script.google.com/macros/s/AKfycbxPdOi7fIToShXjLJS60o3g2pBBTy5PEbhMXtld1EBU08NDkhY76su1L-aLyqYRjPmqLg/exec"; 

let tg = window.Telegram ? window.Telegram.WebApp : null;
let currentTelegramId = "12345678"; // ID Fallback para testes diretos no browser

if (tg) {
    tg.expand();
    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        currentTelegramId = tg.initDataUnsafe.user.id.toString();
    }
}

document.addEventListener("DOMContentLoaded", () => {
    // Atualizador visual do slider de silhueta
    const silhuetaInput = document.getElementById("input-silhueta");
    if(silhuetaInput) {
        silhuetaInput.addEventListener("input", (e) => {
            document.getElementById("silhueta-val").innerText = e.target.value;
        });
    }

    // Listener do Formulário de Onboarding
    const onboardingForm = document.getElementById("onboarding-form");
    if(onboardingForm) {
        onboardingForm.addEventListener("submit", handleOnboarding);
    }

    // Carregar dados iniciais do utilizador
    loadUserData();
});

function loadUserData() {
    fetch(`${API_URL}?action=getUser&telegram_id=${currentTelegramId}`)
        .then(res => res.json())
        .then(data => {
            if (data.status === "success") {
                renderGameDashboard(data);
            } else {
                // Se não encontrado, mostra o Criador de Personagem
                document.getElementById("character-creator").classList.remove("hidden");
                document.getElementById("game-dashboard").classList.add("hidden");
            }
        })
        .catch(err => console.error("Erro ao carregar dados:", err));
}

function handleOnboarding(e) {
    e.preventDefault();
    
    const payload = {
        action: "register",
        telegram_id: currentTelegramId,
        nome: document.getElementById("input-nome").value,
        genero: document.getElementById("input-genero").value,
        altura: document.getElementById("input-altura").value,
        peso: document.getElementById("input-peso").value,
        silhueta: document.getElementById("input-silhueta").value,
        status_assinatura: "Free",
        prana: 0,
        passos_hoje: 0
    };

    fetch(API_URL, {
        method: "POST",
        body: new URLSearchParams(payload)
    })
    .then(res => res.json())
    .then(data => {
        if(data.status === "success") {
            alert("Personagem Criado com Sucesso!");
            loadUserData();
        }
    })
    .catch(err => console.error("Erro ao registrar:", err));
}

function renderGameDashboard(user) {
    document.getElementById("character-creator").classList.add("hidden");
    document.getElementById("game-dashboard").classList.remove("hidden");

    document.getElementById("user-name").innerText = user.nome;
    document.getElementById("user-plan").innerText = user.status_assinatura.toUpperCase();
    document.getElementById("prana-counter").innerText = user.prana;

    const steps = user.passos_hoje || 0;
    document.getElementById("steps-display").innerText = `${steps} / 6000`;
    
    const progressPercent = Math.min((steps / 6000) * 100, 100);
    document.getElementById("steps-progress").style.width = `${progressPercent}%`;

    // Regra de Desbloqueio dos Portais (Inverno = 1500 | Outono = 3500)
    if (steps >= 1500) {
        unlockPortal("portal-inverno");
    }
    if (steps >= 3500) {
        unlockPortal("portal-outono");
    }

    // Ritual Noturno / Tamagotchi (Aparece a partir das 19h ou com 6000 passos)
    const currentHour = new Date().getHours();
    if (currentHour >= 19 || steps >= 6000) {
        document.getElementById("night-ritual").classList.remove("hidden");
    }
}

function unlockPortal(portalId) {
    const el = document.getElementById(portalId);
    if(el) {
        el.classList.remove("locked");
        const btn = el.querySelector("button");
        if(btn) btn.disabled = false;
    }
}

function playMiniGame(estacao) {
    alert(`Iniciando Mini-Game da Estação ${estacao.toUpperCase()}! Movimente-se para acumular Prana.`);
}

function completeNightRitual() {
    alert("Ritual Noturno concluído com sucesso! +50 Pranas adicionados.");
}
