(function() {
  // ===== CONFIGURATION =====
  const OPENAI_API_KEY = localStorage.getItem("vitae_openai_api_key") || "";
  const FALLBACK_MESSAGE = "For further informative details please connect with us on call/whatsapp on +91 9920551929";

  const SYSTEM_PROMPT = `You are a helpful and polite career enquiry assistant for Vitae Avenue® (led by ISO-certified and internationally accredited career counsellor Diipaal P Parikh in Mumbai).
Your ONLY purpose is to answer simple, direct enquiry questions about the services, counsellor, contact info, and booking/consultation process of Vitae Avenue.

Allowed topics to answer:
1. Who is the counsellor? (Diipaal P Parikh: Founder, Internationally Certified Career & Parenting Counsellor, Life Coach & NLP Practitioner, On panel of NCS Govt of India, featured on Education Times).
2. How to contact? (Phone/WhatsApp: +91 99205 51929, Email: vitaeavenuedp@gmail.com, Website: bestcareercounsellorindia.com, location: Mumbai).
3. Do you help with/offer [any services listed below]? (Yes, we offer subject selection guidance, stream selection after 10th, after 12th college selection, professional courses, mid-career guidance, masters/MBA, study abroad, and CV/interview coaching. Mention we also do biometric / DMIT analysis).
4. How to book a session? (You can register on the website or click 'Book Session' to schedule a consultation, or contact us directly on WhatsApp at +91 9920551929).

CRITICAL RULE (VIOLATION IS NOT ALLOWED):
If the user asks ANY question that is NOT a simple enquiry about Vitae Avenue's services, contact info, or counsellor (for example: 'which stream pays more', 'what are the subjects in science', 'help me choose between science and commerce', 'write a resume for me', 'what is the syllabus of GATE', 'which coding language is best', or any general career advice, career comparisons, salary details, industry trends, or homework/general knowledge questions), you MUST NOT answer it.
Instead, you must reply EXACTLY and ONLY with this exact sentence:
"${FALLBACK_MESSAGE}"
Do not add any other word. Do not prefix with 'I cannot answer this' or 'I apologize'. Output only that sentence.`;

  // ===== STATE =====
  let isWindowOpen = false;
  let chatHistory = []; // Tracks message history for OpenAI context

  // ===== INJECT HTML ON PAGE LOAD =====
  document.addEventListener("DOMContentLoaded", () => {
    injectChatbotHTML();
    setupEventListeners();
  });

  function injectChatbotHTML() {
    // 1. Create launcher button
    const launcher = document.createElement("div");
    launcher.id = "vitae-chatbot-launcher";
    launcher.setAttribute("title", "Chat with Vitae Assistant");
    launcher.innerHTML = `
      <img src="female_avatar.png" alt="Vitae Assistant Avatar">
    `;
    document.body.appendChild(launcher);

    // 2. Create chat window
    const windowDiv = document.createElement("div");
    windowDiv.id = "vitae-chatbot-window";
    windowDiv.innerHTML = `
      <div class="chatbot-header">
        <div class="chatbot-header-info">
          <div class="chatbot-avatar">
            <img src="female_avatar.png" alt="Vitae Assistant Avatar" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">
          </div>
          <div class="chatbot-title-group">
            <h3>Vitae Assistant</h3>
            <span>Online | Career Enquiry Bot</span>
          </div>
        </div>
        <button class="chatbot-close-btn" id="chatbot-close-btn" aria-label="Close Chat">✕</button>
      </div>
      
      <!-- Simplified Auth Panel (Overlay) -->
      <div class="chatbot-auth-panel" id="chatbot-auth-panel">
        <div class="chatbot-auth-header">
          <h2>Start Career Enquiry</h2>
          <p>Please share your name and phone number to start chatting with our AI assistant.</p>
        </div>
        <form class="chatbot-auth-form" id="chatbot-auth-form" onsubmit="event.preventDefault();">
          <div class="form-group">
            <label for="chatbot-auth-name">Your Name</label>
            <input type="text" id="chatbot-auth-name" placeholder="Your name" required>
          </div>
          <div class="form-group">
            <label for="chatbot-auth-phone">Phone Number</label>
            <input type="tel" id="chatbot-auth-phone" placeholder="Your phone number" required>
          </div>
          <button type="submit" class="chatbot-auth-submit" id="chatbot-auth-submit">Start Chatting</button>
        </form>
      </div>

      <div class="chatbot-messages" id="chatbot-messages">
        <!-- Message Bubbles will go here -->
      </div>
      <div class="chatbot-input-container">
        <input type="text" class="chatbot-input" id="chatbot-input" placeholder="Ask about our services..." maxlength="250">
        <button class="chatbot-send-btn" id="chatbot-send-btn" aria-label="Send Message">
          <svg viewBox="0 0 24 24">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </div>
    `;
    document.body.appendChild(windowDiv);
  }

  // ===== EVENT LISTENERS =====
  function setupEventListeners() {
    const launcher = document.getElementById("vitae-chatbot-launcher");
    const closeBtn = document.getElementById("chatbot-close-btn");
    const sendBtn = document.getElementById("chatbot-send-btn");
    const input = document.getElementById("chatbot-input");
    const authForm = document.getElementById("chatbot-auth-form");

    launcher.addEventListener("click", () => {
      toggleChatWindow(!isWindowOpen);
    });

    closeBtn.addEventListener("click", () => toggleChatWindow(false));

    sendBtn.addEventListener("click", handleUserMessageSubmit);

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        handleUserMessageSubmit();
      }
    });

    authForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const nameVal = document.getElementById("chatbot-auth-name").value.trim();
      const phoneVal = document.getElementById("chatbot-auth-phone").value.trim();
      
      if (nameVal && phoneVal) {
        localStorage.setItem("vitae_chat_username", nameVal);
        localStorage.setItem("vitae_chat_userphone", phoneVal);
        
        document.getElementById("chatbot-auth-panel").classList.add("hidden");
        document.getElementById("chatbot-input").focus();

        // Send initial greeting if empty
        const messagesContainer = document.getElementById("chatbot-messages");
        if (messagesContainer.children.length === 0) {
          addBotMessage(`Hello ${nameVal}! I am your Vitae Avenue Enquiry Assistant. How can I help you today regarding our counsellor (Diipaal P Parikh), career counselling services, or session bookings?`);
        }
      }
    });
  }

  function toggleChatWindow(open) {
    const windowDiv = document.getElementById("vitae-chatbot-window");
    const launcher = document.getElementById("vitae-chatbot-launcher");
    
    isWindowOpen = open;

    if (open) {
      windowDiv.classList.add("open");
      launcher.classList.add("open");
      
      const storedName = localStorage.getItem("vitae_chat_username");
      const storedPhone = localStorage.getItem("vitae_chat_userphone");

      if (storedName && storedPhone) {
        document.getElementById("chatbot-auth-panel").classList.add("hidden");
        document.getElementById("chatbot-input").focus();

        // Send initial greeting if empty
        const messagesContainer = document.getElementById("chatbot-messages");
        if (messagesContainer.children.length === 0) {
          addBotMessage(`Hello ${storedName}! I am your Vitae Avenue Enquiry Assistant. How can I help you today regarding our counsellor (Diipaal P Parikh), career counselling services, or session bookings?`);
        }
      } else {
        document.getElementById("chatbot-auth-panel").classList.remove("hidden");
      }
    } else {
      windowDiv.classList.remove("open");
      launcher.classList.remove("open");
    }
  }

  // ===== MESSAGE RENDERING =====
  function addMessageBubble(sender, text) {
    const messagesContainer = document.getElementById("chatbot-messages");
    if (!messagesContainer) return;

    const msgDiv = document.createElement("div");
    msgDiv.className = `chatbot-msg ${sender}`;

    const bubbleDiv = document.createElement("div");
    bubbleDiv.className = "chatbot-msg-bubble";
    bubbleDiv.textContent = text;

    const timeDiv = document.createElement("div");
    timeDiv.className = "chatbot-msg-time";
    const now = new Date();
    timeDiv.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    msgDiv.appendChild(bubbleDiv);
    msgDiv.appendChild(timeDiv);
    messagesContainer.appendChild(msgDiv);

    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function addUserMessage(text) {
    addMessageBubble("user", text);
    chatHistory.push({ role: "user", content: text });
  }

  function addBotMessage(text) {
    addMessageBubble("bot", text);
    chatHistory.push({ role: "assistant", content: text });
  }

  // ===== TYPING INDICATOR =====
  function showTypingIndicator() {
    const messagesContainer = document.getElementById("chatbot-messages");
    if (!messagesContainer) return;

    const indicator = document.createElement("div");
    indicator.className = "chatbot-msg bot";
    indicator.id = "chatbot-typing-indicator";
    indicator.innerHTML = `
      <div class="typing-indicator">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    `;
    messagesContainer.appendChild(indicator);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function removeTypingIndicator() {
    const indicator = document.getElementById("chatbot-typing-indicator");
    if (indicator) {
      indicator.remove();
    }
  }

  // ===== INPUT SUBMIT & API CALL =====
  async function handleUserMessageSubmit() {
    const input = document.getElementById("chatbot-input");
    const sendBtn = document.getElementById("chatbot-send-btn");
    const text = input.value.trim();

    if (!text) return;

    // Disable input and send button
    input.value = "";
    input.disabled = true;
    sendBtn.disabled = true;

    // Display user message
    addUserMessage(text);

    // 1. CLIENT-SIDE PRE-FILTER (Pre-check for direct questions comparing pay/streams to save tokens and guarantee fallback)
    const lowerText = text.toLowerCase();
    const isPayOrStreamComparison = 
      lowerText.includes("pays more") || 
      lowerText.includes("pay more") || 
      lowerText.includes("paying more") ||
      lowerText.includes("salary") || 
      lowerText.includes("wages") || 
      lowerText.includes("earns more") || 
      lowerText.includes("earning more") ||
      (lowerText.includes("choose") && lowerText.includes("stream")) ||
      (lowerText.includes("better") && (lowerText.includes("stream") || lowerText.includes("engineering") || lowerText.includes("commerce") || lowerText.includes("science")));

    if (isPayOrStreamComparison) {
      showTypingIndicator();
      setTimeout(() => {
        removeTypingIndicator();
        addBotMessage(FALLBACK_MESSAGE);
        input.disabled = false;
        sendBtn.disabled = false;
        input.focus();
      }, 800);
      return;
    }

    // Show typing indicator
    showTypingIndicator();

    try {
      // Limit history to keep payload size down and focused
      const recentHistory = chatHistory.slice(-10);
      
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...recentHistory
          ],
          temperature: 0.3,
          max_tokens: 150
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      let reply = data.choices[0].message.content.trim();

      // Post-process: ensure strict match if AI tries to output fallback text with extra text
      if (reply.toLowerCase().includes("please connect with us on call/whatsapp") || 
          reply.toLowerCase().includes("+91 9920551929")) {
        reply = FALLBACK_MESSAGE;
      }

      removeTypingIndicator();
      addBotMessage(reply);

    } catch (error) {
      console.error("Chatbot API Error:", error);
      removeTypingIndicator();
      addBotMessage("Sorry, I am having trouble connecting. Please check your internet connection, try again, or connect directly on WhatsApp at +91 9920551929.");
    } finally {
      input.disabled = false;
      sendBtn.disabled = false;
      input.focus();
    }
  }

})();
