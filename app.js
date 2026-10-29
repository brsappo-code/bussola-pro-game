const API_URL = "https://script.google.com/macros/s/AKfycbxPdOi7fIToShXjLJS60o3g2pBBTy5PEbhMXtld1EBU08NDkhY76su1L-aLyqYRjPmqLg/exec"; 

let tg = window.Telegram ? window.Telegram.WebApp : null;
let currentTelegramId = "7202627825"; // ID Fallback
let currentUserData = null;

// Variáveis do Contador de Passos Ativo
let sensorPassosAtivo = false;
let ultimoAcelerometro = { x: 0, y: 0, z: 0 };
let limitePasso = 12.0; // Sensibilidade de aceleração
let tempoUltimoPasso = 0;

// Variáveis da Câmara e MediaPipe Pose
let cameraInstance = null;
let poseInstance = null;

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
    iniciarSensorMovimento();
});

function mostrarCriadorDePersonagem() {
    const creator = document.getElementById("character-creator");
    const dashboard = document.getElementById("game-dashboard");
    if(creator) creator.classList.remove("hidden");
    if(dashboard) dashboard.classList.add("hidden");
}

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

    atualizarInterfacePassos(user.passos_hoje || 0);
}

function atualizarInterfacePassos(steps) {
    if(!currentUserData) currentUserData = {};
    currentUserData.passos_hoje = steps;

    // Cálculo automático de Prana baseado nos passos (Ex: a cada 100 passos = 5 de Prana)
    const pranaGerado = Math.floor(steps / 100) * 5;
    currentUserData.prana = pranaGerado;

    // Atualiza visualmente na HUD e no Painel
    document.getElementById("steps-display").innerText = `${steps} / 6000`;
    document.getElementById("prana-counter").innerText = pranaGerado;
    
    const progressPercent = Math.min((steps / 6000) * 100, 100);
    document.getElementById("steps-progress").style.width = `${progressPercent}%`;

    // Desbloqueio dinâmico dos Portais
    const portalInverno = document.getElementById("portal-inverno");
    const statusInverno = document.getElementById("status-inverno");
    if (steps >= 1500) {
        portalInverno.style.opacity = "1";
        portalInverno.classList.remove("locked");
        statusInverno.innerText = "🔓 ABERTO";
        statusInverno.style.color = "#34d399";
    }

    const portalOutono = document.getElementById("portal-outono");
    const statusOutono = document.getElementById("status-outono");
    if (steps >= 3500) {
        portalOutono.style.opacity = "1";
        portalOutono.classList.remove("locked");
        statusOutono.innerText = "🔓 ABERTO";
        statusOutono.style.color = "#34d399";
    }
}

// 👣 LÓGICA DO CONTADOR DE PASSOS
function iniciarSensorMovimento() {
    if (window.DeviceMotionEvent) {
        window.addEventListener('devicemotion', (event) => {
            const acc = event.accelerationIncludingGravity;
            if (!acc) return;

            const agora = Date.now();
            const magnitude = Math.sqrt(acc.x * acc.x + acc.y * acc.y + acc.z * acc.z);

            if (magnitude > limitePasso && (agora - tempoUltimoPasso) > 400) {
                tempoUltimoPasso = agora;
                if (currentUserData) {
                    const novosPassos = (currentUserData.passos_hoje || 0) + 1;
                    atualizarInterfacePassos(novosPassos);
                }
            }
        });
    }
}

function simularPassos(qtd) {
    if (!currentUserData) return;
    const novosPassos = (currentUserData.passos_hoje || 0) + qtd;
    atualizarInterfacePassos(novosPassos);
}

// 📷 VISÃO COMPUTACIONAL DOS PORTAIS (MEDIAPIPE)
function entrarPortal(tipo) {
    const steps = currentUserData ? (currentUserData.passos_hoje || 0) : 0;
    
    if (tipo === 'inverno' && steps < 1500) {
        alert("🔒 O Portal do Inverno exige pelo menos 1.500 passos para ser desbloqueado!");
        return;
    }
    if (tipo === 'outono' && steps < 3500) {
        alert("🔒 O Portal do Outono exige pelo menos 3.500 passos para ser desbloqueado!");
        return;
    }

    document.getElementById("modal-portal").classList.remove("hidden");
    document.getElementById("portal-modal-title").innerText = tipo === 'inverno' ? "❄️ PORTAL DO INVERNO - ALONGAMENTO" : "🍂 PORTAL DO OUTONO - CORE";

    iniciarCameraPostura();
}

function fecharPortal() {
    document.getElementById("modal-portal").classList.add("hidden");
    if (cameraInstance) {
        cameraInstance.stop();
    }
}

function iniciarCameraPostura() {
    const videoElement = document.getElementById('webcam');
    const canvasElement = document.getElementById('output-canvas');
    const canvasCtx = canvasElement.getContext('2d');
    const feedback = document.getElementById('feedback-postura');

    poseInstance = new Pose({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
    });

    poseInstance.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });

    poseInstance.onResults((results) => {
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

        if (results.poseLandmarks) {
            feedback.innerText = "✨ Alquimista Detetado! Mantenha a Postura Estável!";
            feedback.style.color = "#34d399";
            
            // Desenhar pontos articulares simples no Canvas
            for (const landmark of results.poseLandmarks) {
                canvasCtx.beginPath();
                canvasCtx.arc(landmark.x * canvasElement.width, landmark.y * canvasElement.height, 4, 0, 2 * Math.PI);
                canvasCtx.fillStyle = '#38bdf8';
                canvasCtx.fill();
            }
        } else {
            feedback.innerText = "⚠️ Posicione-se visível na câmara...";
            feedback.style.color = "#facc15";
        }
        canvasCtx.restore();
    });

    cameraInstance = new Camera(videoElement, {
        onFrame: async () => {
            await poseInstance.send({ image: videoElement });
        },
        width: 320,
        height: 240
    });

    cameraInstance.start();
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
