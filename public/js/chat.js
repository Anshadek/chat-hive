/* chat.js
   Client-side chat + socket + media + WebRTC logic.
   Place this file at: public/js/chat.js
*/

(() => {
    // ======= Config / endpoints (adjust if your API paths differ) =======
    const API_BASE = '/api';
    const UPLOAD_ENDPOINT = `${API_BASE}/uploads/file`;
    const ACCEPTED_ENDPOINT = `${API_BASE}/message-request/accepted-list`;   // accepted list
    const PENDING_ENDPOINT  = `${API_BASE}/message-request/pending`;
    const REJECTED_ENDPOINT = `${API_BASE}/message-request/rejected`;
    const HISTORY_ENDPOINT  = `${API_BASE}/chat/history`; // GET /chat/history/:userId (optional)
    localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MjAwNmU5ZmI1NWVkYzJlMTQ2YmRhOSIsImlhdCI6MTc2NDE1MTQxNSwiZXhwIjoxNzY0MTU1MDE1fQ.iUH4UjpsQi-Dr-w0fwFUN5lcdhbNeaNCQXtPSfaNzLs');
    const token = localStorage.getItem('token'); // must be set on signin
  
    if (!token) {
      // if not signed in, redirect to signin page (if exists)
      // console.warn('No auth token found; redirecting to /signin.html');
      // window.location.href = '/signin.html';
    }
  
    // ======= UI elements =======
    const listContainer = document.getElementById('listContainer');
    const searchInput = document.getElementById('searchInput');
    const refreshBtn = document.getElementById('refreshBtn');
    const tabs = Array.from(document.querySelectorAll('.tab'));
  
    const activeNameEl = document.getElementById('activeName');
    const activeStatusEl = document.getElementById('activeStatus');
    const messagesEl = document.getElementById('messages');
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    const imageBtn = document.getElementById('imageBtn');
    const fileInput = document.getElementById('fileInput');
    const recordBtn = document.getElementById('recordBtn');
  
    const videoCallBtn = document.getElementById('videoCallBtn');
    const audioCallBtn = document.getElementById('audioCallBtn');
    const endCallBtn = document.getElementById('endCallBtn');
    const callOverlay = document.getElementById('callOverlay');
    const localVideo = document.getElementById('localVideo');
    const remoteVideo = document.getElementById('remoteVideo');
    const muteBtn = document.getElementById('muteBtn');
    const hangupBtn = document.getElementById('hangupBtn');
  
    // ======= State =======
    let activeTab = 'approved';
    let contacts = []; // array of users for current tab
    let activeContact = null; // { _id, name, ... }
    let socket = null;
  
    // message store if server history endpoint not available
    const messageStore = {}; // keyed by contactId -> [{from:'me'|'them', type:'text'|'image'|'audio', text, time, url}]
  
    // WebRTC state
    let pc = null;
    let localStream = null;
    let currentCallRoom = null;
    let isMuted = false;
  
    // ICE servers: add TURN in production
    const pcConfig = {
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    };
  
    // ======= Utilities =======
    function authHeaders() {
      return token ? { Authorization: 'Bearer ' + token } : {};
    }
    function fmtTime(date = new Date()) {
      return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    function ensureMessageListFor(id) {
      if (!messageStore[id]) messageStore[id] = [];
      return messageStore[id];
    }
  
    // ======= Socket setup =======
    function initSocket() {
      // connect with auth token in handshake
      socket = io('/', { auth: { token } });
  
      socket.on('connect', () => {
        console.log('socket connected', socket.id);
      });
  
      socket.on('receive-message', (msg) => {
        // msg expected: { from: { id, name }, to, type, message, createdAt }
        const fromId = msg.from && (msg.from.id || msg.from._id);
        const contactId = (activeContact && activeContact._id) || null;
        ensureMessageListFor(fromId).push({ from: 'them', type: msg.type || 'text', text: msg.message, time: msg.createdAt || new Date() });
        // If the message is from active contact, render
        if (contactId && contactId === String(fromId)) {
          appendMessage({ from: 'them', text: msg.message, type: msg.type || 'text', time: msg.createdAt });
        } else {
          // optionally show unread badge in list
          markContactUnread(fromId);
        }
      });
  
      // WebRTC signals from server
      socket.on('incoming-call', async ({ roomId, callerId, type }) => {
        // show confirm to user
        const accept = confirm(`Incoming ${type} call from ${callerId}. Accept?`);
        if (!accept) {
          socket.emit('call-reject', { roomId, targetUserId: callerId });
          return;
        }
        // set active contact to caller
        // if server provides caller info, use it; else set minimal
        activeContact = { _id: callerId, name: callerId };
        setActiveContactUI(activeContact);
  
        currentCallRoom = roomId;
        await prepareLocalMedia(type === 'video');
        createPeerConnection();
  
        // wait for offer events from server -> handled in 'call-offer'
      });
  
      socket.on('call-offer', async ({ roomId, from, sdp }) => {
        // callee receives offer
        if (!pc) createPeerConnection();
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('call-answer', { roomId, targetUserId: from, sdp: answer });
      });
  
      socket.on('call-answer', async ({ roomId, from, sdp }) => {
        // caller receives answer
        if (pc && sdp) {
          await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        }
      });
  
      socket.on('ice-candidate', async ({ from, candidate }) => {
        try {
          if (pc && candidate) await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.warn('Failed to add ICE candidate', err);
        }
      });
  
      socket.on('call-reject', ({ roomId }) => {
        alert('Call was rejected');
        cleanupCall();
      });
  
      socket.on('call-end', ({ roomId }) => {
        alert('Call ended');
        cleanupCall();
      });
    }
  
    // ======= REST: load lists =======
    async function loadList(tab = 'approved') {
      activeTab = tab;
      listContainer.innerHTML = '<div class="user-row">Loading…</div>';
      let url = ACCEPTED_ENDPOINT;
      if (tab === 'pending') url = PENDING_ENDPOINT;
      if (tab === 'rejected') url = REJECTED_ENDPOINT;
      try {
        const res = await fetch(url, { headers: authHeaders() });
        const data = await res.json();
        // assume returned shape { status: true, data: [...] } or just [...]. Normalize:
        contacts = Array.isArray(data) ? data : (data.data || []);
        renderList();
      } catch (err) {
        listContainer.innerHTML = `<div class="user-row">Failed to load: ${err.message}</div>`;
        console.error(err);
      }
    }
  
    function renderList() {
      listContainer.innerHTML = '';
      if (!contacts || contacts.length === 0) {
        listContainer.innerHTML = '<div class="user-row">No users</div>';
        return;
      }
      contacts.forEach((u) => {
        // normalize id/name
        const id = u._id || u.id || u.receiverId || u.senderId || u.userId;
        const name = u.name || u.email || (u.sender && u.sender.name) || (u.receiver && u.receiver.name) || id;
        const row = document.createElement('div');
        row.className = 'user-row';
        row.dataset.id = id;
        row.innerHTML = `
          <div class="user-avatar">${(name[0]||'U').toUpperCase()}</div>
          <div class="user-meta">
            <div class="user-name">${name}</div>
            <div class="user-sub">${u.type || u.status || ''}</div>
          </div>
          <div class="user-badge">${u.unread || ''}</div>
        `;
        row.addEventListener('click', async () => {
          // when clicking a user, set as active and load history
          activeContact = { _id: id, name };
          setActiveContactUI(activeContact);
          await loadHistory(id);
          // enable chat/call buttons only if in approved tab
          const approved = activeTab === 'approved';
          videoCallBtn.disabled = !approved;
          audioCallBtn.disabled = !approved;
        });
        listContainer.appendChild(row);
      });
    }
  
    function markContactUnread(contactId) {
      // increment badge on UI if present
      const row = listContainer.querySelector(`[data-id="${contactId}"]`);
      if (!row) return;
      const badge = row.querySelector('.user-badge');
      let n = parseInt(badge.textContent||'0') || 0;
      n = n + 1;
      badge.textContent = n;
    }
  
    function setActiveContactUI(contact) {
      activeNameEl.textContent = contact.name || contact._id || 'Unknown';
      activeStatusEl.textContent = contact.status || (activeTab==='approved' ? 'Approved user' : 'Not approved');
      messagesEl.innerHTML = '';
    }
  
    // ======= History & messages =======
    async function loadHistory(contactId) {
      messagesEl.innerHTML = '<div class="msg them">Loading history…</div>';
      try {
        // try server endpoint first
        const res = await fetch(`${HISTORY_ENDPOINT}/${contactId}`, { headers: authHeaders() });
        if (res.ok) {
          const data = await res.json();
          const msgs = Array.isArray(data) ? data : (data.data || []);
          messageStore[contactId] = msgs.map(m => ({ from: m.from === 'me' ? 'me' : 'them', type: m.type || 'text', text: m.message || m.text, time: m.createdAt || m.time }));
        } else {
          // if no server history, leave local store
          if (!messageStore[contactId]) messageStore[contactId] = [];
        }
      } catch (err) {
        console.warn('History fetch failed (server may not provide it)', err);
        if (!messageStore[contactId]) messageStore[contactId] = [];
      }
      renderMessagesFor(contactId);
    }
  
    function renderMessagesFor(contactId) {
      const msgs = ensureMessageListFor(contactId);
      messagesEl.innerHTML = '';
      msgs.forEach(m => appendMessage(m));
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }
  
    function appendMessage(msg) {
      const el = document.createElement('div');
      el.className = 'msg ' + (msg.from === 'me' ? 'me' : 'them');
      if (msg.type === 'image') {
        const img = document.createElement('img');
        img.src = msg.text; img.style.maxWidth = '320px'; el.appendChild(img);
      } else if (msg.type === 'audio') {
        const a = document.createElement('audio'); a.controls = true; a.src = msg.text; el.appendChild(a);
      } else {
        el.textContent = msg.text;
      }
      const meta = document.createElement('div'); meta.className = 'msg-meta'; meta.textContent = fmtTime(msg.time);
      el.appendChild(meta);
      messagesEl.appendChild(el);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }
  
    // ======= Sending messages =======
    sendBtn.addEventListener('click', async () => {
      if (!activeContact) return alert('Select a contact first');
      const text = messageInput.value.trim();
      if (!text) return;
      const msg = { from: 'me', type: 'text', text, time: new Date() };
      ensureMessageListFor(activeContact._id).push(msg);
      appendMessage(msg);
  
      // emit via socket
      if (socket && socket.connected) {
        socket.emit('send-message', { toUserId: activeContact._id, type: 'text', message: text });
      } else {
        console.warn('Socket not connected; message not sent to server');
      }
      messageInput.value = '';
    });
  
    // image upload
    imageBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', async (ev) => {
      if (!fileInput.files || !fileInput.files[0]) return;
      const file = fileInput.files[0];
      if (!activeContact) return alert('Select a contact first');
      const fd = new FormData(); fd.append('file', file);
      try {
        const res = await fetch(UPLOAD_ENDPOINT, { method: 'POST', headers: authHeaders(), body: fd });
        const data = await res.json();
        if (data.status && data.url) {
          const url = data.url;
          const msg = { from: 'me', type: 'image', text: url, time: new Date() };
          ensureMessageListFor(activeContact._id).push(msg);
          appendMessage(msg);
          socket.emit('send-message', { toUserId: activeContact._id, type: 'image', message: url, meta: { filename: data.filename } });
        } else {
          alert('Upload failed');
        }
      } catch (err) {
        console.error('Upload error', err); alert('Upload failed');
      } finally {
        fileInput.value = '';
      }
    });
  
    // voice note recording (simple)
    let mediaRecorder = null;
    recordBtn.addEventListener('click', async () => {
      if (!recordBtn.dataset.recording) {
        // start recording
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          alert('Recording not supported');
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        const chunks = [];
        mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
        mediaRecorder.onstop = async () => {
          const blob = new Blob(chunks, { type: 'audio/webm' });
          // upload
          const fd = new FormData(); fd.append('file', blob, 'voice.webm');
          try {
            const res = await fetch(UPLOAD_ENDPOINT, { method: 'POST', headers: authHeaders(), body: fd });
            const data = await res.json();
            if (data.status && data.url) {
              const url = data.url;
              const msg = { from: 'me', type: 'audio', text: url, time: new Date() };
              ensureMessageListFor(activeContact._id).push(msg);
              appendMessage(msg);
              socket.emit('send-message', { toUserId: activeContact._id, type: 'audio', message: url });
            } else alert('Upload failed');
          } catch (err) { console.error(err); alert('Upload failed'); }
        };
        mediaRecorder.start();
        recordBtn.dataset.recording = '1';
        recordBtn.textContent = '⏹️ Stop';
      } else {
        // stop
        mediaRecorder?.stop();
        recordBtn.removeAttribute('data-recording');
        recordBtn.textContent = '🎙️';
      }
    });
  
    // ======= Calls (WebRTC) =======
    videoCallBtn.addEventListener('click', () => startCall('video'));
    audioCallBtn.addEventListener('click', () => startCall('audio'));
    endCallBtn.addEventListener('click', () => {
      if (socket && currentCallRoom && activeContact) {
        socket.emit('call-end', { roomId: currentCallRoom, targetUserId: activeContact._id });
      }
      cleanupCall();
    });
  
    async function startCall(type) {
      if (!activeContact) return alert('Select a contact first');
      // get local media
      await prepareLocalMedia(type === 'video');
      createPeerConnection();
  
      // create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
  
      // initiate on server to create call record and notify callee
      socket.emit('call-initiate', { calleeId: activeContact._id, type });
  
      // wait for call-initiated reply with roomId — server should emit 'call-initiated'
      socket.once('call-initiated', ({ roomId }) => {
        currentCallRoom = roomId;
        socket.emit('call-offer', { roomId, targetUserId: activeContact._id, sdp: offer });
      });
  
      // set UI
      callOverlay.classList.remove('hidden');
      endCallBtn.disabled = false;
    }
  
    async function prepareLocalMedia(withVideo = true) {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: withVideo });
        localVideo.srcObject = localStream;
      } catch (err) {
        console.error('getUserMedia failed', err);
        alert('Could not access camera/mic: ' + err.message);
        throw err;
      }
    }
  
    function createPeerConnection() {
      pc = new RTCPeerConnection(pcConfig);
  
      // send local tracks
      if (localStream) {
        localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
      }
  
      pc.ontrack = (e) => {
        // remote stream available
        remoteVideo.srcObject = e.streams[0];
        callOverlay.classList.remove('hidden');
      };
  
      pc.onicecandidate = (evt) => {
        if (evt.candidate && socket && activeContact) {
          socket.emit('ice-candidate', { roomId: currentCallRoom, targetUserId: activeContact._id, candidate: evt.candidate });
        }
      };
  
      pc.onconnectionstatechange = () => {
        if (pc && pc.connectionState === 'disconnected') {
          cleanupCall();
        }
      };
    }
  
    function cleanupCall() {
      try { pc?.close(); } catch (e) {}
      pc = null;
      try { localStream?.getTracks()?.forEach(t => t.stop()); } catch (e) {}
      localStream = null;
      currentCallRoom = null;
      callOverlay.classList.add('hidden');
      endCallBtn.disabled = true;
    }
  
    // ======= UI events & startup =======
    // tabs
    tabs.forEach(t => t.addEventListener('click', async (e) => {
      tabs.forEach(x => x.classList.remove('active'));
      t.classList.add('active');
      const tab = t.dataset.tab;
      await loadList(tab);
    }));
    refreshBtn.addEventListener('click', () => loadList(activeTab));
    searchInput.addEventListener('input', () => {
      // simple client-side filter
      const q = searchInput.value.toLowerCase();
      Array.from(listContainer.children).forEach(row => {
        const name = row.querySelector('.user-name')?.textContent?.toLowerCase() || '';
        row.style.display = name.includes(q) ? '' : 'none';
      });
    });
  
    // keyboard send
    messageInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault(); sendBtn.click();
      }
    });
  
    // initial
    (async () => {
      initSocket();
      await loadList('approved');
    })();
  
  })();
  