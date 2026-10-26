// URL oficial do Google Apps Script conectada ao banco de dados no Google Sheets
const API_URL = "https://script.google.com/macros/s/AKfycbxPdOi7fIToShXjLJS60o3g2pBBTy5PEbhMXtld1EBU08NDkhY76su1L-aLyqYRjPmqLg/exec"; 

let tg = window.Telegram ? window.Telegram.WebApp : null;
let currentTelegramId = "7202627825"; // ID Fallback / Padrão de Testes

if (tg) {
    tg.expand();
    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        currentTelegramId = tg.initDataUnsafe.user.id.toString();
    }
}

document.addEventListener("DOMContentLoaded", () => {
    // 1. REGRA DE OURO: O MiniApp SEMPRE abre no Criador de Personagem para novos utilizadores
    mostrarCriadorDePersonagem();

    // Listener do Slider de Silhueta Virtual
    const silhuetaInput = document.getElementById("input-silhueta");
    if(silhuetaInput) {
        silhuetaInput.addEventListener("input", (e) => {
            const val = document.getElementById("silhueta-val");
            if(val) val.innerText = e.target.value;
        });
    }

    // Listener do Seletor de Biótipo para Feedback Instantâneo
    const biotipoInput = document.getElementById("input-biotipo");
    if(biotipoInput) {
        biotipoInput.addEventListener("change", (e) => {
            const valBio = document.getElementById("val-biotipo");
            if(valBio) valBio.innerText = e.target.value;
        });
    }

    // Listener do Formulário de Onboarding
    const onboardingForm = document.getElementById("onboarding-form");
    if(onboardingForm) {
        onboardingForm.addEventListener("submit", handleOnboarding);
    }

    // 2. Verifica se o utilizador já tem cadastro prévio na planilha
    verificarCadastroExistente();
});

function mostrarCriadorDePersonagem() {
    const creator = document.getElementById("character-creator");
    const dashboard = document.getElementById("game-dashboard");
    if(creator) creator.classList.remove("hidden");
    if(dashboard) dashboard.classList.add("hidden");
}

function calcularBiometria() {
    const alturaInput = document.getElementById("input-altura");
    const pesoInput = document.getElementById("input-peso");
    const valImc = document.getElementById("val-imc");

    if (alturaInput && pesoInput && valImc) {
        const altura = parseFloat(alturaInput.value) / 100;
        const peso = parseFloat(pesoInput.value);
        
        if (altura > 0 && peso > 0) {
            const imc = (peso / (altura * altura)).toFixed(1);
            valImc.innerText = imc;
        } else {
            valImc.innerText = "--";
        }
    }
}

function verificarCadastroExistente() {
    fetch(`${API_URL}?action=getUser&telegram_id=${currentTelegramId}`)
        .then(res => res.json())
        .then(data => {
            // Se a planilha retornar um utilizador válido E com nome cadastrado, aí sim levamos para o Dashboard
            if (data.status === "success" && data.nome && data.nome.trim() !== "") {
                renderGameDashboard(data);
            }
            // Se não, o utilizador continua livremente preenchendo o formulário que já está na tela.
        })
        .catch(err => {
            console.log("Utilizador novo ou sem cadastro prévio. Permanece no criador de personagem.");
        });
}

function handleOnboarding(e) {
    e.preventDefault();
    
    const payload = {
        action: "register",
        telegram_id: currentTelegramId,
        nome: document.getElementById("input-nome").value,
        genero: document.getElementById("input-genero").value,
        biotipo: document.getElementById("input-biotipo").value,
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
            alert("✨ Personagem Criado com Sucesso! Bem-vindo ao Bússola PRO!");
            verificarCadastroExistente();
        }
    })
    .catch(err => console.error("Erro ao registrar personagem:", err));
}

function renderGameDashboard(user) {
    document.getElementById("character-creator").classList.add("hidden");
    document.getElementById("game-dashboard").classList.remove("hidden");

    document.getElementById("user-name").innerText = user.nome || "Aventureiro";
    document.getElementById("user-plan").innerText = (user.status_assinatura || "Free").toUpperCase();
    document.getElementById("prana-counter").innerText = user.prana || 0;

    const steps = user.passos_hoje || 0;
    document.getElementById("steps-display").innerText = `${steps} / 6000`;
    
    const progressPercent = Math.min((steps / 6000) * 100, 100);
    document.getElementById("steps-progress").style.width = `${progressPercent}%`;

    if (steps >= 1500) {
        const portalInverno = document.getElementById("portal-inverno");
        if(portalInverno) {
            portalInverno.style.opacity = "1";
            portalInverno.classList.remove("locked");
        }
    }
    if (steps >= 3500) {
        const portalOutono = document.getElementById("portal-outono");
        if(portalOutono) {
            portalOutono.style.opacity = "1";
            portalOutono.classList.remove("locked");
        }
    }
}
