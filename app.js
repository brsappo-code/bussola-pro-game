const tg = window.Telegram ? window.Telegram.WebApp : null;
const API_URL = "https://script.google.com/macros/s/AKfycbxPdOi7fIToShXjLJS60o3g2pBBTy5PEbhMXtld1EBU08NDkhY76su1L-aLyqYRjPmqLg/exec";

let userTelegramId = 123456; // Fallback
let stepCount = 0;
let metaSteps = 6000;
let lastAccel = { x: 0, y: 0, z: 0 };
let hasUnsavedSteps = false;

if (tg) {
  tg.ready();
  tg.expand();
  if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
    userTelegramId = tg.initDataUnsafe.user.id;
    document.getElementById("user-name").innerText = tg.initDataUnsafe.user.first_name || "Aluno";
  }
}

// Atualiza a interface (contador e barra de progresso)
function updateUI() {
  document.getElementById("steps-display").innerText = stepCount.toLocaleString();
  const pct = Math.min(100, Math.round((stepCount / metaSteps) * 100));
  const progressBar = document.getElementById("progress-bar");
  if (progressBar) {
    progressBar.style.width = `${pct}%`;
  }
  const pctText = document.getElementById("pct-text");
  if (pctText) {
    pctText.innerText = `${pct}% da meta atingida`;
  }
}

// Carregar dados iniciais do utilizador
async function loadUserData() {
  try {
    const res = await fetch(`${API_URL}?action=get_user&telegram_id=${userTelegramId}`);
    const data = await res.json();
    if (data.status === "success") {
      document.getElementById("estacao-badge").innerText = data.user.Estacao_Groppo_Atual || "Inverno";
      document.getElementById("user-biotipo").innerText = data.user.Biotipo || "Mesomorfo";
      document.getElementById("user-silhueta").innerText = `Nível ${data.user.Silhueta || 1}`;
      stepCount = parseInt(data.user.Passos_Hoje) || 0;
      updateUI();
    }
  } catch (err) {
    console.error("Erro ao carregar dados:", err);
  }
}

// Salvar passos no Google Sheets
async function saveSteps() {
  const btnSave = document.getElementById("save-btn");
  if (btnSave) btnSave.innerText = "A guardar...";

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        action: "update_steps",
        telegram_id: userTelegramId,
        passos: stepCount
      })
    });
    const data = await res.json();
    if (data.status === "success") {
      hasUnsavedSteps = false;
      if (btnSave) btnSave.innerText = "Guardado com Sucesso! 💾";
      setTimeout(() => { if (btnSave) btnSave.innerText = "Guardar Progresso"; }, 2000);
    }
  } catch (err) {
    console.error("Erro ao guardar passos:", err);
    if (btnSave) btnSave.innerText = "Erro ao guardar ❌";
  }
}

// Sensor do Acelerómetro
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

    if (deltaX + deltaY + deltaZ > 12) {
      stepCount++;
      hasUnsavedSteps = true;
      updateUI();
    }
    lastAccel = { x: acc.x, y: acc.y, z: acc.z };
  });
  document.getElementById("sensor-btn").innerText = "Sensor Ativo 🟢";
}

// Guardar automático a cada 30 segundos se houver novos passos
setInterval(() => {
  if (hasUnsavedSteps) saveSteps();
}, 30000);

document.getElementById("save-btn")?.addEventListener("click", saveSteps);

loadUserData();
