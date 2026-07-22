const API_URL = "https://assintente2-ultratelecom.onrender.com";
let currentChatId = null;
let isRegisterMode = false;

// Inicialização: verifica se já está logado
document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  if (token) {
    showApp();
  } else {
    showAuth();
  }
});

// Alterna entre tela de Login e Cadastro
function toggleAuthMode(e) {
  e.preventDefault();
  isRegisterMode = !isRegisterMode;
  
  document.getElementById("authTitle").innerText = isRegisterMode ? "Cadastro - UltraTelecom" : "Login - UltraTelecom";
  document.getElementById("authBtn").innerText = isRegisterMode ? "Cadastrar" : "Entrar";
  document.getElementById("toggleText").innerText = isRegisterMode ? "Já tem uma conta?" : "Não tem uma conta?";
  document.getElementById("toggleLink").innerText = isRegisterMode ? "Faça Login" : "Cadastre-se";
  document.getElementById("authAdminSecret").style.display = isRegisterMode ? "block" : "none";
  document.getElementById("authError").innerText = "";
}

// Executa Login ou Cadastro
async function handleAuth() {
  const email = document.getElementById("authEmail").value.trim();
  const password = document.getElementById("authPassword").value.trim();
  const errorEl = document.getElementById("authError");
  errorEl.innerText = "";

  if (!email || !password) {
    errorEl.innerText = "Preencha e-mail e senha.";
    return;
  }

  try {
    if (isRegisterMode) {
      // Cadastro
      const adminSecret = document.getElementById("authAdminSecret").value.trim();
      const res = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, admin_secret: adminSecret || null })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Erro no cadastro.");
      
      alert("Conta criada com sucesso! Faça login.");
      toggleAuthMode(new Event('click'));
    } else {
      // Login
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);

      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Usuário ou senha incorretos.");

      localStorage.setItem("token", data.access_token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("email", data.email);

      showApp();
    }
  } catch (err) {
    errorEl.innerText = err.message;
  }
}

function showAuth() {
  document.getElementById("authContainer").style.display = "flex";
  document.getElementById("appContainer").style.display = "none";
}

function showApp() {
  document.getElementById("authContainer").style.display = "none";
  document.getElementById("appContainer").style.display = "flex";

  const email = localStorage.getItem("email");
  const role = localStorage.getItem("role");

  document.getElementById("userBadge").innerText = `${email} (${role})`;

  if (role === "admin") {
    document.getElementById("adminLink").style.display = "block";
  }

  loadChatHistory();
}

function logout() {
  localStorage.clear();
  showAuth();
}

// Lógica de Mensagens e Histórico
async function sendMsg() {
  const input = document.getElementById("userInput");
  const text = input.value.trim();
  if (!text) return;

  appendMessage(text, "user");
  input.value = "";

  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`${API_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ chat_id: currentChatId, message: text })
    });

    if (!res.ok) throw new Error("Erro de conexão");

    const data = await res.json();
    currentChatId = data.chat_id;
    appendMessage(data.reply, "bot");
    loadChatHistory();
  } catch (err) {
    appendMessage("Erro ao enviar mensagem. Tente novamente.", "bot");
  }
}

function appendMessage(text, sender) {
  const chatBox = document.getElementById("chatBox");
  const div = document.createElement("div");
  div.className = `message ${sender}`;
  div.innerHTML = sender === "bot" && typeof marked !== "undefined" ? marked.parse(text) : text;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

async function loadChatHistory() {
  const token = localStorage.getItem("token");
  try {
    const res = await fetch(`${API_URL}/chats`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!res.ok) return;

    const chats = await res.json();
    const historyEl = document.getElementById("chatHistory");
    historyEl.innerHTML = "";

    chats.forEach(chat => {
      const item = document.createElement("div");
      item.className = "history-item";
      item.innerText = chat.title;
      item.onclick = () => loadSingleChat(chat.id);
      historyEl.appendChild(item);
    });
  } catch (err) {
    console.error(err);
  }
}

async function loadSingleChat(chatId) {
  const token = localStorage.getItem("token");
  try {
    const res = await fetch(`${API_URL}/chats/${chatId}`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!res.ok) return;

    const chat = await res.json();
    currentChatId = chat.id;

    const chatBox = document.getElementById("chatBox");
    chatBox.innerHTML = "";

    chat.messages.forEach(msg => {
      appendMessage(msg.text, msg.sender);
    });
  } catch (err) {
    console.error(err);
  }
}

function startNewChat() {
  currentChatId = null;
  document.getElementById("chatBox").innerHTML = '<div class="message bot">Nova conversa iniciada! Como posso ajudar?</div>';
}
