// Inject the chat widget HTML into every page
document.body.insertAdjacentHTML('beforeend', `
  <button class="chat-bubble" id="chatBubble">
    <span class="chat-bubble-pulse"></span>
    <span class="chat-bubble-icon">🤖</span>
  </button>
  <div class="chat-window" id="chatWindow">
    <div class="chat-header">
      <img src="assets/images/logo.png" alt="Young Peacemakers">
      <div>
        <h4>Young Peacemakers</h4>
        <p id="chatHeaderStatus">Ask us anything</p>
      </div>
      <button class="chat-close-btn" id="chatCloseBtn">✕</button>
    </div>
    <div class="chat-messages" id="chatMessages">
      <div class="chat-msg bot">Hi! I can help answer common questions, or connect you with our team. What would you like to know?</div>
    </div>
    <div class="chat-quick-replies" id="chatQuickReplies">
      <button class="quick-reply-btn" data-topic="programs">Our Programs</button>
      <button class="quick-reply-btn" data-topic="register">How to Register</button>
      <button class="quick-reply-btn" data-topic="donate">How to Donate</button>
      <button class="quick-reply-btn" data-topic="teacher">Teacher Training</button>
      <button class="quick-reply-btn" data-topic="human">Talk to a Person</button>
    </div>
    <div class="chat-human-form" id="chatHumanForm" style="display:none;">
      <input type="text" id="humanName" placeholder="Your name">
      <input type="email" id="humanEmail" placeholder="Your email">
      <textarea id="humanMessage" placeholder="Your message" rows="3"></textarea>
      <button class="btn btn-primary btn-small" id="humanFormSubmit" style="width:100%;">Start Conversation</button>
    </div>
    <div class="chat-input-row" id="chatInputRow">
      <input type="text" id="chatInput" placeholder="Type a message...">
      <button class="chat-send-btn" id="chatSendBtn">➤</button>
    </div>
  </div>
`);

const chatBubble = document.getElementById('chatBubble');
const chatWindow = document.getElementById('chatWindow');
const chatCloseBtn = document.getElementById('chatCloseBtn');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const chatSendBtn = document.getElementById('chatSendBtn');
const chatQuickReplies = document.getElementById('chatQuickReplies');
const chatHumanForm = document.getElementById('chatHumanForm');
const humanFormSubmit = document.getElementById('humanFormSubmit');
const chatHeaderStatus = document.getElementById('chatHeaderStatus');

let activeConversationId = localStorage.getItem('ypo_conversation_id') || null;
let pollInterval = null;

chatBubble.addEventListener('click', () => {
  chatWindow.classList.toggle('open');
  if (chatWindow.classList.contains('open') && activeConversationId) {
    loadConversation();
  }
});

chatCloseBtn.addEventListener('click', () => {
  chatWindow.classList.remove('open');
});

function addMessage(text, sender) {
  const msg = document.createElement('div');
  msg.className = `chat-msg ${sender === 'admin' ? 'bot' : sender}`;
  msg.textContent = text;
  chatMessages.appendChild(msg);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return msg;
}

const responses = {
  programs: "We run 7 core programs: Peace Clubs, Trauma Healing & Psycho-Social Support, Summer Camps, Peer Mediation Training, School Curriculums, Parent & Community Partnerships, and Peace Parades. Visit our Programs page for details!",
  register: "Parents/guardians register their child (with a birth certificate + your ID card), and teachers register with proof of teaching + a CV. There's a one-time 1,000 XAF registration fee. Head to our Sign Up page to get started!",
  donate: "You can donate $2, $5, $10, $20, or a custom amount (minimum $2) via PayPal, MTN Mobile Money, or Visa/Mastercard on our Donate page. Every bit helps a child heal and learn peace-building skills!",
  teacher: "Our teacher training covers 3 pillars: Pedagogical Peace Frameworks, Restorative Classroom Management, and Trauma-Informed Rehabilitation & Intervention. Check out our Teacher Training page for more!",
};

function showHumanForm() {
  chatQuickReplies.style.display = 'none';
  chatHumanForm.style.display = 'flex';
  addMessage("Sure! Fill out the form below to start a conversation with our team.", 'bot');
}

function switchToThreadMode() {
  chatQuickReplies.style.display = 'none';
  chatHumanForm.style.display = 'none';
  chatHeaderStatus.textContent = "Chatting with our team";
}

function handleQuickReply(topic) {
  const labels = {
    programs: "Our Programs",
    register: "How to Register",
    donate: "How to Donate",
    teacher: "Teacher Training",
    human: "Talk to a Person"
  };

  addMessage(labels[topic], 'user');

  if (topic === 'human') {
    showHumanForm();
  } else {
    setTimeout(() => {
      addMessage(responses[topic], 'bot');
    }, 400);
  }
}

chatQuickReplies.addEventListener('click', (e) => {
  if (e.target.classList.contains('quick-reply-btn')) {
    handleQuickReply(e.target.dataset.topic);
  }
});

humanFormSubmit.addEventListener('click', async () => {
  const name = document.getElementById('humanName').value.trim();
  const email = document.getElementById('humanEmail').value.trim();
  const message = document.getElementById('humanMessage').value.trim();

  if (!name || !email || !message) {
    alert('Please fill in all fields.');
    return;
  }

  const { data: convo, error: convoError } = await supabaseClient
    .from('conversations')
    .insert({ visitor_name: name, visitor_email: email })
    .select()
    .single();

  if (convoError || !convo) {
    addMessage("Sorry, something went wrong. Please try our Contact page instead.", 'bot');
    console.error(convoError);
    return;
  }

  activeConversationId = convo.id;
  localStorage.setItem('ypo_conversation_id', activeConversationId);

  await supabaseClient.from('thread_messages').insert({
    conversation_id: activeConversationId,
    sender: 'visitor',
    content: message
  });

  document.getElementById('humanName').value = '';
  document.getElementById('humanEmail').value = '';
  document.getElementById('humanMessage').value = '';

  switchToThreadMode();
  addMessage("Thanks! Your message has been sent. For the fastest reply, please stay on this page for the next 2-3 minutes — our team is online and typically responds quickly.", 'bot');

  startPolling();
});

async function loadConversation() {
  if (!activeConversationId) return;

  const { data: messages, error } = await supabaseClient
    .from('thread_messages')
    .select('*')
    .eq('conversation_id', activeConversationId)
    .order('created_at', { ascending: true });

  if (error || !messages) return;

  chatMessages.innerHTML = '';
  messages.forEach(m => addMessage(m.content, m.sender));

  switchToThreadMode();
  startPolling();
}

let knownMessageIds = new Set();

function startPolling() {
  if (pollInterval) clearInterval(pollInterval);
  pollInterval = setInterval(async () => {
    if (!activeConversationId) return;

    const { data: messages } = await supabaseClient
      .from('thread_messages')
      .select('*')
      .eq('conversation_id', activeConversationId)
      .order('created_at', { ascending: true });

    if (!messages) return;

    if (knownMessageIds.size === 0) {
      messages.forEach(m => knownMessageIds.add(m.id));
      return;
    }

    messages.forEach(m => {
      if (!knownMessageIds.has(m.id)) {
        knownMessageIds.add(m.id);
        if (m.sender === 'admin') {
          addMessage(m.content, 'admin');
        }
      }
    });
  }, 5000);
}

async function sendMessage() {
  const text = chatInput.value.trim();
  if (!text) return;

  chatInput.value = '';

  // If we're already in an active thread, send as a thread message
  if (activeConversationId) {
    addMessage(text, 'user');
    await supabaseClient.from('thread_messages').insert({
      conversation_id: activeConversationId,
      sender: 'visitor',
      content: text
    });
    await supabaseClient
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', activeConversationId);
    return;
  }

  // Otherwise, fall back to FAQ keyword matching
  addMessage(text, 'user');
  const lower = text.toLowerCase();
  let matched = false;

  if (lower.includes('program') || lower.includes('club') || lower.includes('camp')) {
    setTimeout(() => addMessage(responses.programs, 'bot'), 400);
    matched = true;
  } else if (lower.includes('regist') || lower.includes('sign up') || lower.includes('enroll')) {
    setTimeout(() => addMessage(responses.register, 'bot'), 400);
    matched = true;
  } else if (lower.includes('donat') || lower.includes('give') || lower.includes('pay')) {
    setTimeout(() => addMessage(responses.donate, 'bot'), 400);
    matched = true;
  } else if (lower.includes('teacher') || lower.includes('training')) {
    setTimeout(() => addMessage(responses.teacher, 'bot'), 400);
    matched = true;
  } else if (lower.includes('human') || lower.includes('person') || lower.includes('help') || lower.includes('speak')) {
    showHumanForm();
    matched = true;
  }

  if (!matched) {
    setTimeout(() => {
      addMessage("I'm not sure about that one — try one of the quick options below, or ask to speak with a person!", 'bot');
    }, 400);
  }
}

chatSendBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});

// On load, if we already have an active conversation, restore it
if (activeConversationId) {
  loadConversation();
}