// ===== PAGE NAVIGATION =====
function showPage(pageId, updateHash = true) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + pageId);
  if(target) {
    target.classList.add('active');
    window.scrollTo({top:0,behavior:'smooth'});
    if (updateHash) {
      window.location.hash = pageId;
    }
  }
}

document.addEventListener('click', (e) => {
  const link = e.target.closest('a');
  if (link && link.getAttribute('href') === '#') {
    e.preventDefault();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const hash = window.location.hash.replace('#', '');
  if (hash) {
    showPage(hash, false);
  } else {
    window.location.hash = 'home';
  }
});

window.addEventListener('hashchange', () => {
  const hash = window.location.hash.replace('#', '');
  if (hash) {
    showPage(hash, false);
  } else {
    showPage('home', false);
  }
});

// ===== MOBILE MENU =====
function toggleMobileMenu() {
  document.getElementById('mobileMenu').classList.toggle('open');
}

// ===== FAQ TOGGLE =====
function toggleFaq(el) {
  const item = el.parentElement;
  item.classList.toggle('open');
}

// ===== SCROLL ANIMATIONS =====
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => { if(e.isIntersecting) e.target.classList.add('visible'); });
}, {threshold:0.1});

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
});

// ===== NAVBAR SCROLL =====
window.addEventListener('scroll', () => {
  const navbar = document.getElementById('navbar');
  if (navbar) {
    navbar.style.boxShadow = window.scrollY > 10 ? '0 2px 24px rgba(0,0,0,0.1)' : 'none';
  }
});
