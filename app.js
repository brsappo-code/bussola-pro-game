const API_URL = "https://script.google.com/macros/s/AKfycbxPdOi7fIToShXjLJS60o3g2pBBTy5PEbhMXtld1EBU08NDkhY76su1L-aLyqYRjPmqLg/exec"; 

let tg = window.Telegram ? window.Telegram.WebApp : null;
let currentTelegramId = "7202627825"; // ID Fallback / Padrão de Testes
let currentUserData = null;

if (tg) {
    tg.expand();
    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        currentTelegramId = tg.initDataUnsafe.user.id.toString();
    }
}

document.addEventListener("DOMContentLoaded", () => {
    mostrarCriadorDePersonagem();

    const silhuetaInput = document.getElementById("input-silhueta");
    if(silhuetaInput) {
        silhuetaInput.addEventListener("input", (e) => {
            const val = document.getElementById("silhueta-val");
            if(val) val.innerText = e.target.value;
        });
    }

    const biotipoInput = document.getElementById("input-biotipo");
    if(biotipoInput) {
        biotipoInput.addEventListener("change", (e) => {
            const valBio = document.getElementById("val-biotipo");
            if(valBio) valBio.innerText = e.target.value;
        });
    }

    const onboardingForm = document.getElementById("onboarding-form");
    if(onboardingForm) {
        onboardingForm.addEventListener("submit", handleOnboarding);
    }

    verificarCadastroExistente();
});

function mostrarCriadorDePersonagem() {
    const creator = document.getElementById("character-creator");
    const dashboard = document.getElementById("game-dashboard");
    if(creator) creator.classList.remove("hidden");
    if(dashboard) dashboard.classList.add("hidden");
}

// Funções para controle do modal de biótipo
function abrirModalBiotipo() {
    const modal = document.getElementById("modal-biotipo");
    if(modal) modal.classList.remove("hidden");
}

function fecharModalBiotipo() {
    const modal = document.getElementById("modal-biotipo");
    if(modal) modal.classList.add("hidden");
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
            if (data.status === "success" && data.nome && data.nome.trim() !== "") {
                currentUserData = data;
                renderGameDashboard(data);
            }
        })
        .catch(err => {
            console.log("Alquimista novo ou aguardando cadastro.");
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
            alert("✨ Alquimista Registrado com Sucesso! Bem-vindo ao Bússola PRO!");
            verificarCadastroExistente();
        }
    })
    .catch(err => console.error("Erro ao registrar alquimista:", err));
}

function renderGameDashboard(user) {
    document.getElementById("character-creator").classList.add("hidden");
    document.getElementById("game-dashboard").classList.remove("hidden");

    document.getElementById("user-name").innerText = user.nome || "Alquimista";
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

function exportarPergaminhoTXT() {
    if (!currentUserData) {
        alert("Nenhum dado de alquimista encontrado para exportar.");
        return;
    }

    const alturaM = parseFloat(currentUserData.altura) / 100;
    const pesoKg = parseFloat(currentUserData.peso);
    const imc = (alturaM > 0 && pesoKg > 0) ? (pesoKg / (alturaM * alturaM)).toFixed(1) : "N/A";

    const conteudoPergaminho = `
====================================================
⚔️ PERGAMINHO DE ATRIBUTOS - BÚSSOLA PRO ⚔️
====================================================
Alquimista      : ${currentUserData.nome || "Desconhecido"}
ID Telegram    : ${currentUserData.telegram_id || currentTelegramId}
Plano Atual    : ${(currentUserData.status_assinatura || "Free").toUpperCase()}
Data de Registro: ${new Date().toLocaleDateString('pt-BR')}

--- BIOMETRIA & FISIOLOGIA ---
Gênero         : ${currentUserData.genero || "N/A"}
Biotipo        : ${currentUserData.biotipo || "N/A"}
Altura         : ${currentUserData.altura} cm
Peso           : ${currentUserData.peso} kg
IMC Calculado  : ${imc}
Silhueta (1-9) : ${currentUserData.silhueta || "5"} / 9

--- EVOLUÇÃO NO JOGO ---
Prana Acumulado: ✨ ${currentUserData.prana || 0}
Passos Registados: 👣 ${currentUserData.passos_hoje || 0} / 6000

====================================================
Método Groppo - Transformando saúde em uma jornada épica.
====================================================
    `.trim();

    const blob = new Blob([conteudoPergaminho], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Pergaminho_${(currentUserData.nome || "Alquimista").replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
