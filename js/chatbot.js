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
        <p>Ask us anything</p>
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
      <button class="btn btn-primary btn-small" id="humanFormSubmit" style="width:100%;">Send Message</button>
    </div>
    <div class="chat-input-row">
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

chatBubble.addEventListener('click', () => {
  chatWindow.classList.toggle('open');
});

chatCloseBtn.addEventListener('click', () => {
  chatWindow.classList.remove('open');
});

function addMessage(text, sender) {
  const msg = document.createElement('div');
  msg.className = `chat-msg ${sender}`;
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
  addMessage("Sure! Fill out the form below and our team will get back to you.", 'bot');
}

function hideHumanForm() {
  chatHumanForm.style.display = 'none';
  chatQuickReplies.style.display = 'flex';
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

  const { error } = await supabaseClient.from('support_messages').insert({ name, email, message });

  document.getElementById('humanName').value = '';
  document.getElementById('humanEmail').value = '';
  document.getElementById('humanMessage').value = '';

  if (error) {
    addMessage("Sorry, something went wrong sending your message. Please try our Contact page instead.", 'bot');
    console.error(error);
  } else {
    addMessage("Thank you! Your message has been sent to our team — we'll get back to you soon.", 'bot');
  }

  hideHumanForm();
});

function sendMessage() {
  const text = chatInput.value.trim();
  if (!text) return;

  addMessage(text, 'user');
  chatInput.value = '';

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