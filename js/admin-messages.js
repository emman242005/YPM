let activeConvoId = null;
let threadPollInterval = null;
let knownAdminMsgIds = new Set();

async function loadInbox() {
  const inboxList = document.getElementById('inboxList');

  const { data: conversations, error } = await supabaseClient
    .from('conversations')
    .select('*, thread_messages(content, sender, created_at, read_by_admin)')
    .order('last_message_at', { ascending: false });

  if (error) {
    inboxList.innerHTML = `<p class="empty-note">Error: ${error.message}</p>`;
    return;
  }

  if (!conversations || conversations.length === 0) {
    inboxList.innerHTML = `<p class="empty-note">No conversations yet.</p>`;
    return;
  }

  inboxList.innerHTML = '';

  conversations.forEach(convo => {
    const msgs = convo.thread_messages || [];
    const lastMsg = msgs.length ? msgs[msgs.length - 1] : null;
    const hasUnread = msgs.some(m => m.sender === 'visitor' && !m.read_by_admin);

    const item = document.createElement('div');
    item.className = 'inbox-item' + (convo.id === activeConvoId ? ' active' : '');
    item.innerHTML = `
      <div class="inbox-item-name">
        ${convo.visitor_name}
        ${hasUnread ? '<span class="inbox-unread-dot"></span>' : ''}
      </div>
      <div class="inbox-item-preview">${lastMsg ? lastMsg.content : 'No messages yet'}</div>
    `;
    item.addEventListener('click', () => openConversation(convo));
    inboxList.appendChild(item);
  });
}

async function openConversation(convo) {
  activeConvoId = convo.id;
  knownAdminMsgIds = new Set();

  loadInbox();

  const panel = document.getElementById('threadPanel');
  panel.innerHTML = `
    <div class="thread-header">
      ${convo.visitor_name}
      <span>${convo.visitor_email}</span>
    </div>
    <div class="thread-body" id="threadBody"></div>
    <div class="thread-input-row">
      <input type="text" id="threadInput" placeholder="Type a reply...">
      <button class="chat-send-btn" id="threadSendBtn">➤</button>
    </div>
  `;

  await loadThreadMessages();

  document.getElementById('threadSendBtn').addEventListener('click', sendThreadReply);
  document.getElementById('threadInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendThreadReply();
  });

  await supabaseClient
    .from('thread_messages')
    .update({ read_by_admin: true })
    .eq('conversation_id', convo.id)
    .eq('sender', 'visitor');

  startThreadPolling();
}

async function loadThreadMessages() {
  const threadBody = document.getElementById('threadBody');
  if (!threadBody) return;

  const { data: messages, error } = await supabaseClient
    .from('thread_messages')
    .select('*')
    .eq('conversation_id', activeConvoId)
    .order('created_at', { ascending: true });

  if (error || !messages) return;

  threadBody.innerHTML = '';
  messages.forEach(m => {
    knownAdminMsgIds.add(m.id);
    const msgEl = document.createElement('div');
    msgEl.className = `thread-msg ${m.sender}`;
    msgEl.textContent = m.content;
    threadBody.appendChild(msgEl);
  });
  threadBody.scrollTop = threadBody.scrollHeight;
}

function startThreadPolling() {
  if (threadPollInterval) clearInterval(threadPollInterval);
  threadPollInterval = setInterval(async () => {
    if (!activeConvoId) return;

    const { data: messages } = await supabaseClient
      .from('thread_messages')
      .select('*')
      .eq('conversation_id', activeConvoId)
      .order('created_at', { ascending: true });

    if (!messages) return;

    const threadBody = document.getElementById('threadBody');
    if (!threadBody) return;

    let hasNew = false;
    messages.forEach(m => {
      if (!knownAdminMsgIds.has(m.id)) {
        knownAdminMsgIds.add(m.id);
        const msgEl = document.createElement('div');
        msgEl.className = `thread-msg ${m.sender}`;
        msgEl.textContent = m.content;
        threadBody.appendChild(msgEl);
        hasNew = true;
      }
    });

    if (hasNew) {
      threadBody.scrollTop = threadBody.scrollHeight;
      loadInbox();
    }
  }, 5000);
}

async function sendThreadReply() {
  const input = document.getElementById('threadInput');
  const text = input.value.trim();
  if (!text || !activeConvoId) return;

  input.value = '';

  // Check if this is the first admin reply in this conversation
  const { data: existingAdminMsgs } = await supabaseClient
    .from('thread_messages')
    .select('id')
    .eq('conversation_id', activeConvoId)
    .eq('sender', 'admin');

  const isFirstReply = !existingAdminMsgs || existingAdminMsgs.length === 0;

  if (isFirstReply) {
    await supabaseClient.from('thread_messages').insert({
      conversation_id: activeConvoId,
      sender: 'admin',
      content: `You're now chatting with ${currentAdminName} from our support team.`
    });
  }

  await supabaseClient.from('thread_messages').insert({
    conversation_id: activeConvoId,
    sender: 'admin',
    content: text
  });

  await supabaseClient
    .from('conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', activeConvoId);

  await loadThreadMessages();
}

(async () => {
  const user = await checkAdmin();
  if (!user) return;
  loadInbox();
  updateNotificationCounts();
  setInterval(loadInbox, 8000);
})();