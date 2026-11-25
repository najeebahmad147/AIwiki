// AGAR CLOUDFLARE WORKER BANAYA HAI TOH YAHAN URL PASTE KARO (VARNA KHALI CHHOD DO, BINA KEY BHI CHALEGA!)
const CLOUDFLARE_WORKER_URL = "";

const hudBox = document.getElementById("hudbox");
const langSelect = document.getElementById("langselect");
const micBtn = document.getElementById("micbtn");
const reactor = document.getElementById("reactor");
const visualizer = document.getElementById("visualizer");
const statusText = document.getElementById("statustext");
const chatLog = document.getElementById("chatlog");
const textInput = document.getElementById("textinput");
const sendBtn = document.getElementById("sendbtn");
const apiModal = document.getElementById("apimodal");
const keyBtn = document.getElementById("keybtn");
const saveKeyBtn = document.getElementById("savekeybtn");
const closeModalBtn = document.getElementById("closemodalbtn");
const apiKeyInput = document.getElementById("apikeyinput");
const visionBtn = document.getElementById("visionbtn");
const visionBox = document.getElementById("visionbox");
const camFeed = document.getElementById("camfeed");
const snapCanvas = document.getElementById("snapcanvas");
const memBtn = document.getElementById("membtn");
const memModal = document.getElementById("memmodal");
const memList = document.getElementById("memlist");
const clearMemBtn = document.getElementById("clearmembtn");
const closeMemBtn = document.getElementById("closemembtn");
const clearBtn = document.getElementById("clearbtn");

let isSpeaking = false;
let isProcessing = false;
let visionActive = false;
let camStream = null;
let recognition = null;

function getMemories() {
  try { return JSON.parse(localStorage.getItem("wikiMemories") || "[]"); } catch (e) { return []; }
}

function saveMemory(note) {
  const list = getMemories();
  list.push(note);
  localStorage.setItem("wikiMemories", JSON.stringify(list));
}

function getContacts() {
  try { return JSON.parse(localStorage.getItem("wikiContacts") || "{}"); } catch (e) { return {}; }
}

function saveContact(name, number) {
  const c = getContacts();
  c[name.toLowerCase().trim()] = number.replace(/[^0-9+]/g, "");
  localStorage.setItem("wikiContacts", JSON.stringify(c));
}

function buildSystemPrompt() {
  const mems = getMemories();
  const memText = mems.length > 0 ? " Saved user memories: " + mems.join("; ") + "." : "";
  return {
    role: "system",
    content: "You are WIKI HYPE, an ultra-advanced Iron-Man style polyglot AI assistant created and developed by Najeeb Ahmad. Whenever anyone asks in ANY language who created, built, or made you, always reply in English saying: I was designed and developed by Najeeb Ahmad. He is my creator and my Boss. You fluently understand and reply in the exact language the user uses: Hindi, English, Hinglish, Bihari/Bhojpuri, Bangla, Assamese, Tamil, Japanese, Korean, Chinese, or Spanish. If the user asks you to sing ANY song, rap, or Phonk beat in ANY language, start your reply with [SING] followed by energetic, rhythmic, musical lyrics with beat drops (like 'Brrr-dum-tss!'). Address the user as Boss or Najeeb. Keep normal replies concise (1-3 sentences) and never use markdown asterisks or hashtags." + memText
  };
}

let chatHistory = [buildSystemPrompt()];

function updateClock() {
  const now = new Date();
  document.getElementById("clock").innerText = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
updateClock();
setInterval(updateClock, 1000);

function detectSpeechLang(text) {
  if (langSelect.value !== "auto") return langSelect.value;
  if (/[\u3040-\u30ff]/.test(text)) return "ja-JP";
  if (/[\uac00-\ud7af]/.test(text)) return "ko-KR";
  if (/[\u4e00-\u9fff]/.test(text)) return "zh-CN";
  if (/[\u0980-\u09ff]/.test(text)) return "bn-IN";
  if (/[\u0b80-\u0bff]/.test(text)) return "ta-IN";
  if (/[\u0900-\u097f]/.test(text)) return "hi-IN";
  return "en-IN";
}

function speak(text, isSinging = false) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();

  const cleanText = text.replace(/\[SING\]/gi, "").replace(/[*#_`~]/g, "").trim();
  if (!cleanText) return;

  const targetLang = detectSpeechLang(cleanText);
  const utter = new SpeechSynthesisUtterance(cleanText);
  utter.lang = targetLang;
  utter.pitch = isSinging ? 1.24 : 1.0;
  utter.rate = isSinging ? 1.12 : 1.04;
  utter.volume = 1.0;

  const voices = window.speechSynthesis.getVoices();
  const matchedVoice =
    voices.find(v => v.lang.toLowerCase() === targetLang.toLowerCase()) ||
    voices.find(v => v.lang.toLowerCase().startsWith(targetLang.slice(0, 2).toLowerCase())) ||
    voices.find(v => v.lang.startsWith("en"));
  if (matchedVoice) utter.voice = matchedVoice;

  utter.onstart = () => {
    isSpeaking = true;
    reactor.classList.add("speaking");
    visualizer.classList.add("active");
    if (isSinging) {
      hudBox.classList.add("singing-mode");
      reactor.classList.add("singing");
      visualizer.classList.add("singing");
      statusText.innerText = "♪ SINGING & DJ MODE ACTIVE ♪";
    }
  };

  const resetVisuals = () => {
    isSpeaking = false;
    reactor.classList.remove("speaking", "singing");
    visualizer.classList.remove("active", "singing");
    hudBox.classList.remove("singing-mode");
    statusText.innerText = "Tap ULLI to Speak | Zero-Key Mode Ready";
  };

  utter.onend = resetVisuals;
  utter.onerror = resetVisuals;

  window.speechSynthesis.resume();
  window.speechSynthesis.speak(utter);
}

function addLog(sender, message, type = "aimsg") {
  const p = document.createElement("p");
  p.className = type;
  p.innerText = "[" + sender + "]: " + message.replace(/\[SING\]/gi, "♪ ");
  chatLog.appendChild(p);
  chatLog.scrollTop = chatLog.scrollHeight;
}

visionBtn.addEventListener("click", async () => {
  if (!visionActive) {
    try {
      camStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      camFeed.srcObject = camStream;
      visionActive = true;
      visionBox.classList.remove("hidden");
      visionBtn.classList.add("active");
      addLog("SYSTEM", "Optical Vision Sensor Activated, Boss.", "sysmsg");
    } catch (err) {
      addLog("SYSTEM", "Camera access denied: " + err.message, "sysmsg");
    }
  } else {
    if (camStream) camStream.getTracks().forEach(t => t.stop());
    visionActive = false;
    visionBox.classList.add("hidden");
    visionBtn.classList.remove("active");
  }
});

function captureFrameBase64() {
  if (!visionActive || !camFeed.videoWidth) return null;
  snapCanvas.width = 400;
  snapCanvas.height = Math.round((camFeed.videoHeight / camFeed.videoWidth) * 400);
  snapCanvas.getContext("2d").drawImage(camFeed, 0, 0, snapCanvas.width, snapCanvas.height);
  return snapCanvas.toDataURL("image/jpeg", 0.7);
}

// === SMART BUILT-IN BACKUP BRAIN (WORKS 100% EVEN WITHOUT INTERNET/KEY) ===
function localSmartFallback(cmd, isSing) {
  const l = cmd.toLowerCase();
  if (isSing) {
    if (l.includes("phonk")) {
      return "[SING] Brrr-dum-tss! Bass drop incoming! Drift through the night, neon lights shining bright, WIKI HYPE on the beat, nobody can compete! Boom-bap-skrrt!";
    }
    if (l.includes("bhojpuri") || l.includes("bihari")) {
      return "[SING] La-la-la! Tohar muskaan pe dilwa kurban ba, Najeeb Boss ke system sabse mahaan ba! Dhin-tak-dhin-ta!";
    }
    if (l.includes("japanese")) {
      return "[SING] Yume no sekai e hashiridasu, hikari no naka de kimi to utau! Kira-kira-beat drop!";
    }
    return "[SING] Dil ki dhadkan mein bajta hai sur, WIKI HYPE ka jaadu chhaya hai door-door! La-la-la-boom!";
  }
  if (/^(hi|hello|hey|namaste|salam|hola|konnichiwa|annyeong)/i.test(l)) {
    return "Hello Boss! WIKI HYPE Ultra Core is online and ready for your command.";
  }
  if (l.includes("kaise ho") || l.includes("how are you")) {
    return "All systems are running at 100 percent power, Boss! How can I assist you today?";
  }
  if (l.includes("time") || l.includes("samay") || l.includes("kitna baja")) {
    return "The current time is " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + ", Boss.";
  }
  if (l.includes("date") || l.includes("tarikh")) {
    return "Today's date is " + new Date().toDateString() + ", Boss.";
  }
  return "Command received, Boss: " + cmd + ". All systems are active and listening!";
}

// === FREE ZERO-KEY AI + OPTIONAL GROQ / WORKER ENGINE ===
async function askUniversalAI(apiKey, messages, isVision = false, rawCmd = "", isSing = false) {
  const workerBase = CLOUDFLARE_WORKER_URL.replace(/\/$/, "");
  const groqBase = workerBase || atob("aHR0cHM6Ly9hcGkuZ3JvcS5jb20vb3BlbmFpL3Yx");

  // 1. Try Groq (if user entered Key OR Cloudflare Worker URL is set)
  if (apiKey || workerBase) {
    const headers = { "Content-Type": "application/json" };
    if (apiKey) headers["Authorization"] = "Bearer " + apiKey;

    const models = isVision
      ? ["meta-llama/llama-4-scout-17b-16e-instruct"]
      : ["llama-3.3-70b-versatile", "qwen/qwen3-32b", "meta-llama/llama-4-scout-17b-16e-instruct"];

    for (const modelName of models) {
      try {
        const res = await fetch(groqBase + "/chat/completions", {
          method: "POST",
          headers: headers,
          body: JSON.stringify({ model: modelName, messages: messages, temperature: 0.7, max_tokens: 400 })
        });
        const data = await res.json();
        const replyText = data?.choices?.at(0)?.message?.content?.trim();
        if (res.ok && replyText) return replyText;
      } catch (e) {}
    }
  }

  // 2. Zero-Key Free Public AI Fallback (Works automatically for all users without any API Key!)
  try {
    const freeRes = await fetch("https://pollinations.ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai",
        messages: messages.filter(m => typeof m.content === "string")
      })
    });
    const freeData = await freeRes.json();
  // 2. Zero-Key Free Public AI Fallback (Works automatically for all users without any API Key!)
  try {
    const freeRes = await fetch("https://pollinations.ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai",
        messages: messages.filter(m => typeof m.content === "string")
      })
    });
    const freeData = await freeRes.json();
    const freeReply = freeData?.choices?.at(0)?.message?.content?.trim();
    if (freeRes.ok && freeReply) return freeReply;
  } catch (e) {}

  // 3. Instant Offline Fallback (Never crashes!)
  return localSmartFallback(rawCmd, isSing);
}

async function runCommand(rawCmd) {
  if (!rawCmd || typeof rawCmd !== "string" || !rawCmd.trim() || rawCmd.trim() === "undefined" || isProcessing) return;
  let cmd = rawCmd.replace(/^(hey\s+wiki|wiki\s+hype|wiki|ulli)[,\s]*/i, "").trim();
  if (!cmd) {
    const greet = "Yes Boss, WIKI HYPE is online.";
    addLog("WIKI HYPE", greet);
    speak(greet);
    return;
  }

  isProcessing = true;
  addLog("NAJEEB", cmd, "usermsg");
  const lower = cmd.toLowerCase();

  try {
    // 1. CREATOR CHECK (ALWAYS ENGLISH)
    if (
      lower.includes("kisne banaya") || lower.includes("kisne bnaya") || lower.includes("who created") ||
      lower.includes("who made") || lower.includes("who built") || lower.includes("who developed") ||
      lower.includes("your creator") || lower.includes("your owner") || lower.includes("tumhara malik")
    ) {
      const reply = "I was designed and developed by Najeeb Ahmad. He is my creator and my Boss.";
      addLog("WIKI HYPE", reply);
      speak(reply);
      return;
    }

    // 2. SAVE CONTACT
    const contactMatch = cmd.match(/^save contact\s+([a-zA-Z0-9_ ]+?)\s+(\+?[0-9]{7,15})$/i);
    if (contactMatch) {
      saveContact(contactMatch.at(1), contactMatch.at(2));
      const reply = "Saved contact " + contactMatch.at(1).trim() + ", Boss.";
      addLog("WIKI HYPE", reply);
      speak(reply);
      return;
    }

    // 3. CALL COMMAND
    if (lower.startsWith("call ") || lower.includes("ko call")) {
      const target = lower.replace(/^call\s+/i, "").replace(/\s*ko call.*/i, "").trim();
      const contacts = getContacts();
      const num = contacts[target] || target.replace(/[^0-9+]/g, "");
      if (num && num.length >= 3) {
        const reply = "Calling " + target + " now, Boss.";
        addLog("WIKI HYPE", reply);
        speak(reply);
        window.location.href = "tel:" + num;
      } else {
        const reply = "Boss, say 'Save contact " + target + " [number]' first, or speak the phone number directly.";
        addLog("WIKI HYPE", reply);
        speak(reply);
      }
      return;
    }

    // 4. WHATSAPP MESSAGE
    if (lower.includes("whatsapp")) {
      const contacts = getContacts();
      let phone = "";
      let msgText = cmd.replace(/.*whatsapp\s*(par|pe|on|to|message|msg|send)?/i, "").trim();
      for (const [cName, cNum] of Object.entries(contacts)) {
        if (lower.includes(cName)) {
          phone = cNum.replace("+", "");
          msgText = msgText.replace(new RegExp(cName, "i"), "").replace(/^(ko|to|message|msg|ki|that)\s+/i, "").trim();
          break;
        }
      }
      const reply = "Opening WhatsApp message ready to send, Boss.";
      addLog("WIKI HYPE", reply);
      speak(reply);
      const waUrl = phone
        ? "https://wa.me" + phone + "?text=" + encodeURIComponent(msgText || "Hello")
        : "https://wa.me?text=" + encodeURIComponent(msgText || "Hello");
      window.open(waUrl, "_blank");
      return;
    }

    // 5. YOUTUBE DIRECT SEARCH / SONG / MOVIE / CARTOON PLAY
    if (
      lower.includes("youtube") || lower.startsWith("play ") ||
      lower.includes("chalao") || lower.includes("lagao") || lower.includes("movie") || lower.includes("cartoon")
    ) {
      if (!lower.includes("sing") && !lower.includes("gao") && !lower.includes("gaana gao")) {
        let query = cmd
          .replace(/(open youtube|on youtube|youtube par|youtube pe|youtube|play|chalao|lagao|please)/gi, "")
          .trim();
        if (!query) {
          addLog("WIKI HYPE", "Launching YouTube, Boss.");
          speak("Launching YouTube, Boss.");
          window.open("https://youtube.com", "_blank");
        } else {
          const reply = "Playing " + query + " on YouTube, Boss.";
          addLog("WIKI HYPE", reply);
          speak(reply);
          window.open("https://youtube.com/results?search_query=" + encodeURIComponent(query), "_blank");
        }
        return;
      }
    }

    // 6. SAVE MEMORY
    if (lower.startsWith("remember ") || lower.startsWith("yaad rakhna ")) {
      const note = cmd.replace(/^(remember|yaad rakhna)\s+/i, "").trim();
      saveMemory(note);
      chatHistory = [buildSystemPrompt()];
      const reply = "Saved to permanent memory, Boss: " + note;
      addLog("WIKI HYPE", reply);
      speak(reply);
      return;
    }

    // 7. OPEN WEBSITES
    if (lower.startsWith("open ")) {
      const site = lower.replace("open ", "").trim();
      const sites = {
        google: "https://google.com",
        github: "https://github.com",
        instagram: "https://instagram.com",
        gmail: "https://google.com"
      };
      if (sites[site]) {
        addLog("WIKI HYPE", "Opening " + site + ", Boss.");
        speak("Opening " + site + ", Boss.");
        window.open(sites[site], "_blank");
        return;
      }
    }

    // 8. UNIVERSAL AI (WORKS WITH OR WITHOUT API KEY!)
    const apiKey = (localStorage.getItem("groqKey") || "").trim();
    statusText.innerText = "NEURAL CORE THINKING...";
    if (!Array.isArray(chatHistory) || chatHistory.length === 0) {
      chatHistory = [buildSystemPrompt()];
    } else {
      chatHistory[0] = buildSystemPrompt();
    }

    const isSingRequest = /(sing|song|phonk|rap|gao|gaana|geet|canción|uta|norae)/i.test(cmd);
    const snap = captureFrameBase64();

    if (snap && (apiKey || CLOUDFLARE_WORKER_URL)) {
      const visionMessages = [
        chatHistory[0],
        { role: "user", content: [{ type: "text", text: cmd }, { type: "image_url", image_url: { url: snap } }] }
      ];
      const aiReply = await askUniversalAI(apiKey, visionMessages, true, cmd, false);
      addLog("WIKI HYPE", aiReply);
      speak(aiReply, false);
      return;
    }

    const userPrompt = isSingRequest
      ? cmd + " (Start your reply with [SING] and sing an energetic, rhythmic song or phonk beat in the requested language!)"
      : cmd;

    chatHistory.push({ role: "user", content: userPrompt });
    if (chatHistory.length > 7) chatHistory = [buildSystemPrompt(), ...chatHistory.slice(-6)];

    const aiReply = await askUniversalAI(apiKey, chatHistory, false, cmd, isSingRequest);
    chatHistory.push({ role: "assistant", content: aiReply });

    const shouldSing = isSingRequest || aiReply.toUpperCase().includes("[SING]");
    addLog("WIKI HYPE", aiReply, shouldSing ? "singmsg" : "aimsg");
    speak(aiReply, shouldSing);
    statusText.innerText = "Tap ULLI to Speak | Zero-Key Mode Ready";
  } catch (err) {
    const fallback = localSmartFallback(cmd, false);
    addLog("WIKI HYPE", fallback);
    speak(fallback);
    statusText.innerText = "Tap ULLI to Speak | Zero-Key Mode Ready";
  } finally {
    isProcessing = false;
  }
}

sendBtn.addEventListener("click", () => { runCommand(textInput.value); textInput.value = ""; });
textInput.addEventListener("keydown", (e) => { if (e.key === "Enter") { runCommand(textInput.value); textInput.value = ""; } });

clearBtn.addEventListener("click", () => {
  chatLog.innerHTML = "";
  chatHistory = [buildSystemPrompt()];
  addLog("WIKI HYPE", "Terminal cleared, Boss.");
});

keyBtn.addEventListener("click", () => { apiKeyInput.value = localStorage.getItem("groqKey") || ""; apiModal.classList.remove("hidden"); });
closeModalBtn.addEventListener("click", () => apiModal.classList.add("hidden"));
saveKeyBtn.addEventListener("click", () => {
  localStorage.setItem("groqKey", apiKeyInput.value.trim());
  apiModal.classList.add("hidden");
  addLog("WIKI HYPE", "Optional Groq Key saved, Boss.");
  speak("Optional Groq Key saved, Boss.");
});

memBtn.addEventListener("click", () => {
  const mems = getMemories();
  const contacts = getContacts();
  const contactItems = Object.entries(contacts).map(([k, v]) => "<li>Contact: " + k + " -> " + v + "</li>");
  const memItems = mems.map((m, i) => "<li>Memory " + (i + 1) + ": " + m + "</li>");
  const all = [...contactItems, ...memItems];
  memList.innerHTML = all.length ? all.join("") : "<li>No memories or contacts saved yet.</li>";
  memModal.classList.remove("hidden");
});
closeMemBtn.addEventListener("click", () => memModal.classList.add("hidden"));
clearMemBtn.addEventListener("click", () => {
  localStorage.removeItem("wikiMemories");
  localStorage.removeItem("wikiContacts");
  chatHistory = [buildSystemPrompt()];
  memList.innerHTML = "<li>All data wiped clean, Boss.</li>";
});

// === UNIVERSAL TAP VOICE (CHROME, EDGE, MOBILE + FIREFOX WHISPER) ===
const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
let mediaRecorder = null;
let audioChunks = [];
let isRecordingWhisper = false;

async function toggleWhisperMic() {
  const apiKey = (localStorage.getItem("groqKey") || "").trim();
  const workerBase = CLOUDFLARE_WORKER_URL.replace(/\/$/, "");
  if (!apiKey && !workerBase) {
    statusText.innerText = "USE CHROME/EDGE FOR ZERO-KEY MIC";
    return;
  }

  if (!isRecordingWhisper) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunks = [];
      mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunks.push(e.data); };
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        isRecordingWhisper = false;
        micBtn.innerText = "ULLI";
        reactor.classList.remove("listening");
        statusText.innerText = "UNDERSTANDING VOICE...";
        try {
          const blob = new Blob(audioChunks, { type: "audio/webm" });
          const fd = new FormData();
          fd.append("file", blob, "voice.webm");
          fd.append("model", "whisper-large-v3-turbo");
          const headers = apiKey ? { "Authorization": "Bearer " + apiKey } : {};
          const whisperUrl = (workerBase || atob("aHR0cHM6Ly9hcGkuZ3JvcS5jb20vb3BlbmFpL3Yx")) + "/audio/transcriptions";
          const res = await fetch(whisperUrl, { method: "POST", headers: headers, body: fd });
          const data = await res.json();
          if (res.ok && data.text && data.text.trim()) runCommand(data.text.trim());
          else statusText.innerText = "TAP ULLI TO SPEAK AGAIN";
        } catch (err) {
          statusText.innerText = "VOICE NETWORK ERROR";
        }
      };
      mediaRecorder.start();
      isRecordingWhisper = true;
      micBtn.innerText = "STOP";
      reactor.classList.add("listening");
      statusText.innerText = "LISTENING... TAP STOP WHEN DONE";
    } catch (err) {
      statusText.innerText = "ALLOW MIC PERMISSION IN BROWSER";
    }
  } else if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
  }
}

const isFirefox = navigator.userAgent.toLowerCase().includes("firefox");
if (SpeechRec && !isFirefox) {
  recognition = new SpeechRec();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.onstart = () => {
    statusText.innerText = "TAP MODE: SPEAK NOW...";
    micBtn.innerText = "HEARING";
    reactor.classList.add("listening");
  };
  recognition.onresult = (e) => {
    const transcript = e.results.item(0).item(0).transcript.trim();
    if (transcript) runCommand(transcript);
  };
  recognition.onerror = () => {
    micBtn.innerText = "ULLI";
    reactor.classList.remove("listening");
    toggleWhisperMic();
  };
  recognition.onend = () => {
    micBtn.innerText = "ULLI";
    reactor.classList.remove("listening");
  };
}

function triggerTapVoice() {
  window.speechSynthesis.cancel();
  if (isFirefox || !recognition) { toggleWhisperMic(); return; }
  recognition.lang = langSelect.value === "auto" ? "en-IN" : langSelect.value;
  try { recognition.start(); } catch (err) { try { recognition.stop(); } catch (e) {} }
}

micBtn.addEventListener("click", triggerTapVoice);
reactor.addEventListener("click", triggerTapVoice);
// END ZERO-KEY
