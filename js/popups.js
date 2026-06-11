// ===== DUAL POPUP SYSTEM =====

let scrollStarted = false;
let firstPopupTimer = null;
let firstPopupActive = false;
let secondPopupActive = false;
let secondPopupListenersRegistered = false;
let firstPopupAutoCloseTimer = null;

// Initialize popups on page load
document.addEventListener('DOMContentLoaded', () => {
  // If popups are complete, do nothing
  if (sessionStorage.getItem('popupsComplete')) {
    return;
  }

  // If first popup was already dismissed but second isn't completed/dismissed, initialize second popup listeners
  if (sessionStorage.getItem('firstPopupDismissed')) {
    initSecondPopupListeners();
  } else {
    // Listen for scroll start to trigger the first popup
    window.addEventListener('scroll', handleFirstScrollStart);
  }
});

// Start 15s timer when scroll starts
function handleFirstScrollStart() {
  if (scrollStarted) return;
  
  if (sessionStorage.getItem('firstPopupComplete') || 
      sessionStorage.getItem('firstPopupDismissed') || 
      sessionStorage.getItem('popupsComplete')) {
    scrollStarted = true;
    window.removeEventListener('scroll', handleFirstScrollStart);
    return;
  }

  scrollStarted = true;
  window.removeEventListener('scroll', handleFirstScrollStart);
  
  // Show first popup after 15 seconds of scrolling
  firstPopupTimer = setTimeout(showFirstPopup, 15000);
}

// Show First Popup: Center Modal
function showFirstPopup() {
  if (sessionStorage.getItem('firstPopupComplete') || 
      sessionStorage.getItem('firstPopupDismissed') || 
      sessionStorage.getItem('popupsComplete')) {
    return;
  }

  const modal = document.getElementById('quick-message-center-modal');
  if (modal) {
    modal.classList.add('show');
    document.body.style.overflow = 'hidden'; // Prevent page scroll under modal
    firstPopupActive = true;

    // Auto-cancel after 7 seconds of showing up
    firstPopupAutoCloseTimer = setTimeout(() => {
      if (firstPopupActive) {
        closeCenterModal();
      }
    }, 7000);

    // Cancel auto-close if user starts interacting with the form
    const popupFormBox = modal.querySelector('.popup-box');
    if (popupFormBox) {
      const cancelAutoClose = () => {
        if (firstPopupAutoCloseTimer) {
          clearTimeout(firstPopupAutoCloseTimer);
          firstPopupAutoCloseTimer = null;
        }
      };
      popupFormBox.addEventListener('click', cancelAutoClose);
      popupFormBox.addEventListener('focusin', cancelAutoClose);
    }
  }
}

// Close First Popup
function closeCenterModal() {
  // Clear the auto-close timer if still active
  if (firstPopupAutoCloseTimer) {
    clearTimeout(firstPopupAutoCloseTimer);
    firstPopupAutoCloseTimer = null;
  }

  const modal = document.getElementById('quick-message-center-modal');
  if (modal) {
    modal.classList.remove('show');
    document.body.style.overflow = ''; // Restore page scrolling
  }
  firstPopupActive = false;
  
  // Mark first popup as dismissed with a timestamp (critical for spacing)
  sessionStorage.setItem('firstPopupDismissed', Date.now().toString());
  
  // Initialize listeners for the second popup
  initSecondPopupListeners();
}

// Check if second popup is allowed to show (25s spacing delay)
function canShowSecondPopup() {
  const dismissedTime = sessionStorage.getItem('firstPopupDismissed');
  if (!dismissedTime) return false;

  if (sessionStorage.getItem('secondPopupComplete') || 
      sessionStorage.getItem('secondPopupDismissed') || 
      sessionStorage.getItem('popupsComplete')) {
    return false;
  }

  const elapsed = Date.now() - parseInt(dismissedTime);
  return elapsed >= 25000; // 25 seconds delay
}

// Show Second Popup: Slide-in Side Card
function showSecondPopup() {
  const sideCard = document.getElementById('quick-prompt-side-card');
  if (sideCard) {
    sideCard.classList.add('show');
    secondPopupActive = true;
  }
}

// Close Second Popup
function closeSideCard(e) {
  if (e) e.stopPropagation();
  const sideCard = document.getElementById('quick-prompt-side-card');
  if (sideCard) {
    sideCard.classList.remove('show');
  }
  secondPopupActive = false;
  
  // Dismiss side card and mark entire popup sequence complete
  sessionStorage.setItem('secondPopupDismissed', 'true');
  sessionStorage.setItem('popupsComplete', 'true');
}

// Side Card Action button click (redirects to main contact section)
function triggerSideCardAction() {
  const sideCard = document.getElementById('quick-prompt-side-card');
  if (sideCard) {
    sideCard.classList.remove('show');
  }
  secondPopupActive = false;

  // Mark popup sequence complete
  sessionStorage.setItem('secondPopupComplete', 'true');
  sessionStorage.setItem('popupsComplete', 'true');

  // Route to the contact page
  showPage('contact');

  // Smooth scroll and focus on contact form Name field
  setTimeout(() => {
    const nameInput = document.getElementById('cf-name');
    if (nameInput) {
      nameInput.focus();
      nameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const formBox = nameInput.closest('div');
      if (formBox) {
        formBox.style.transition = 'box-shadow 0.5s';
        formBox.style.boxShadow = '0 0 20px rgba(245, 166, 35, 0.6)';
        setTimeout(() => {
          formBox.style.boxShadow = '';
        }, 1500);
      }
    }
  }, 300);
}

// Initialize second popup triggers (scroll percent & exit-intent)
function initSecondPopupListeners() {
  if (secondPopupListenersRegistered) return;
  secondPopupListenersRegistered = true;

  window.addEventListener('scroll', checkSecondPopupScrollTrigger);
  document.addEventListener('mouseleave', checkSecondPopupExitTrigger);
}

// Check scroll depth past 45%
function checkSecondPopupScrollTrigger() {
  if (!canShowSecondPopup()) return;

  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

  if (scrollPercent >= 45) {
    showSecondPopup();
    removeSecondPopupListeners();
  }
}

// Check mouse cursor leaving screen (exit intent)
function checkSecondPopupExitTrigger(e) {
  if (!canShowSecondPopup()) return;

  if (e.clientY < 20) {
    showSecondPopup();
    removeSecondPopupListeners();
  }
}

// Cleanup listeners after showing
function removeSecondPopupListeners() {
  window.removeEventListener('scroll', checkSecondPopupScrollTrigger);
  document.removeEventListener('mouseleave', checkSecondPopupExitTrigger);
  secondPopupListenersRegistered = false;
}

// Submit Center Popup Inquiry to Supabase
async function submitPopupQuery(e) {
  e.preventDefault();

  // Clear the auto-close timer if still active
  if (firstPopupAutoCloseTimer) {
    clearTimeout(firstPopupAutoCloseTimer);
    firstPopupAutoCloseTimer = null;
  }

  const name = document.getElementById('popup-name').value.trim();
  const phone = document.getElementById('popup-phone').value.trim();
  const email = document.getElementById('popup-email').value.trim();
  const msg = document.getElementById('popup-msg').value.trim();
  const msgStatus = document.getElementById('popup-msg-status');
  const submitBtn = document.getElementById('popupSubmitBtn');

  if (!name || !phone || !email || !msg) {
    msgStatus.className = 'form-msg error';
    msgStatus.textContent = 'Please fill in all required fields.';
    return;
  }

  // Validate exactly 10 digits phone number
  if (!/^\d{10}$/.test(phone)) {
    msgStatus.className = 'form-msg error';
    msgStatus.textContent = 'Phone number must be exactly 10 digits.';
    return;
  }

  // Validate email address structure
  const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}(\.[a-zA-Z]{2,})?$/;
  if (!emailRegex.test(email) || !email.includes('@') || !email.includes('.')) {
    msgStatus.className = 'form-msg error';
    msgStatus.textContent = 'Please enter a valid email address (e.g. name@domain.com).';
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending...';
  msgStatus.className = 'form-msg';
  msgStatus.textContent = '';

  try {
    const { error } = await sbClient.from('contact_enquiries').insert([{
      name,
      phone_number: phone,
      email,
      requirement: 'Quick Popup Query',
      query_message: msg
    }]);

    if (error) throw error;

    msgStatus.className = 'form-msg success';
    msgStatus.textContent = '✅ Thank you! Your message has been sent successfully.';
    submitBtn.textContent = 'Sent!';

    // Mark popup sequence as complete
    sessionStorage.setItem('firstPopupComplete', 'true');
    sessionStorage.setItem('popupsComplete', 'true');

    document.getElementById('popup-message-form').reset();

    // Close center modal and restore body scrolling after successful submission
    setTimeout(() => {
      const modal = document.getElementById('quick-message-center-modal');
      if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
      }
    }, 2000);

  } catch (err) {
    console.error('Popup Submission Error:', err);
    msgStatus.className = 'form-msg error';
    msgStatus.textContent = '❌ Failed to send message. Please check your connection and try again.';
    submitBtn.disabled = false;
    submitBtn.textContent = 'Send Message';
  }
}

// Close Modal when clicking outside the box
document.addEventListener('click', (e) => {
  const modal = document.getElementById('quick-message-center-modal');
  if (firstPopupActive && modal && e.target === modal) {
    closeCenterModal();
  }
});

// Close Modal when pressing Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && firstPopupActive) {
    closeCenterModal();
  }
});

// Expose functions to global namespace for inline HTML click handlers
window.closeCenterModal = closeCenterModal;
window.closeSideCard = closeSideCard;
window.triggerSideCardAction = triggerSideCardAction;
window.submitPopupQuery = submitPopupQuery;
