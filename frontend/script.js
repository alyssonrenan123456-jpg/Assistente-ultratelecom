// Lógica de comunicação com o Backend (API)
async function sendMsg() {
  const input = document.getElementById('userInput');
  const text = input.value.trim();
  if (!text) return;

  appendMessage(text, 'user');
  input.value = '';

  try {
    const res = await fetch('http://localhost:8000/api/chat', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({message: text})
    });
    const data = await res.json();
    appendMessage(data.reply, 'bot');
  } catch (err) {
    appendMessage("Erro ao conectar ao servidor.", 'bot');
  }
}

function appendMessage(text, sender) {
  const chatBox = document.getElementById('chatBox');
  const div = document.createElement('div');
  div.className = `message ${sender}`;
  
  if (sender === 'bot') {
    div.innerHTML = marked.parse(text);
    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn';
    copyBtn.innerText = 'Copiar';
    copyBtn.onclick = () => navigator.clipboard.writeText(text);
    div.appendChild(copyBtn);
  } else {
    div.innerText = text;
  }

  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function newChat() {
  document.getElementById('chatBox').innerHTML = '<div class="message bot">Nova conversa iniciada! Como posso ajudar?</div>';
}