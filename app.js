const tg = window.Telegram ? window.Telegram.WebApp : null;
const API_URL = "https://script.google.com/macros/s/AKfycbxPdOi7fIToShXjLJS60o3g2pBBTy5PEbhMXtld1EBU08NDkhY76su1L-aLyqYRjPmqLg/exec";

let userTelegramId = 123456; // Fallback para testes fora do Telegram
let stepCount = 0;
let lastAccel = { x: 0, y: 0, z: 0 };

if (tg) {
  tg.ready();
  tg.expand();
  if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
    userTelegramId = tg.initDataUnsafe.user.id;
    document.getElementById("user-name").innerText = tg.initDataUnsafe.user.first_name || "Aluno";
  }
}

// Inicializar dados do usuário via Google Apps Script API
async function loadUserData() {
  try {
    const res = await fetch(`${API_URL}?action=get_user&telegram_id=${userTelegramId}`);
    const data = await res.json();
    if (data.status === "success") {
      document.getElementById("estacao-badge").innerText = data.user.Estacao_Groppo_Atual || "Inverno";
      document.getElementById("user-biotipo").innerText = data.user.Biotipo || "Mesomorfo";
      document.getElementById("user-silhueta").innerText = `Nível ${data.user.Silhueta || 1}`;
      stepCount = parseInt(data.user.Passos_Hoje) || 0;
      document.getElementById("steps-display").innerText = stepCount;
    }
  } catch (err) {
    console.error("Erro ao carregar dados:", err);
  }
}

// Detector de Passos simples usando o Acelerómetro do Smartphone
document.getElementById("sensor-btn").addEventListener("click", () => {
  if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
    DeviceMotionEvent.requestPermission().then(response => {
      if (response === 'granted') startAccelerometer();
    });
  } else {
    startAccelerometer();
  }
});

function startAccelerometer() {
  window.addEventListener('devicemotion', (event) => {
    const acc = event.accelerationIncludingGravity;
    if (!acc) return;
    
    const deltaX = Math.abs(acc.x - lastAccel.x);
    const deltaY = Math.abs(acc.y - lastAccel.y);
    const deltaZ = Math.abs(acc.z - lastAccel.z);

    if (deltaX + deltaY + deltaZ > 12) { // Threshold simples de impacto
      stepCount++;
      document.getElementById("steps-display").innerText = stepCount;
    }

    lastAccel = { x: acc.x, y: acc.y, z: acc.z };
  });
  document.getElementById("sensor-btn").innerText = "Sensor Ativo 🟢";
}

loadUserData();
