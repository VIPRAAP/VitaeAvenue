// ===== MODAL =====
function openModal(tab) {
  document.getElementById('modalOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  if(tab) switchTab(tab);
}
function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  document.body.style.overflow = '';
}
function closeModalOutside(e) {
  if(e.target === document.getElementById('modalOverlay')) closeModal();
}
function switchTab(tab) {
  const tabSwitch = document.querySelector('.tab-switch');
  const googleBtn = document.querySelector('.google-btn');
  const divider = document.querySelector('.divider');
  
  if (tab === 'complete-profile') {
    if (tabSwitch) tabSwitch.style.display = 'none';
    if (googleBtn) googleBtn.style.display = 'none';
    if (divider) divider.style.display = 'none';
  } else {
    if (tabSwitch) tabSwitch.style.display = 'flex';
    if (googleBtn) googleBtn.style.display = 'flex';
    if (divider) divider.style.display = 'block';
  }

  document.querySelectorAll('.tab-switch button').forEach((b,i) => b.classList.toggle('active', (tab==='register'&&i===0)||(tab==='login'&&i===1)));
  document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
  const targetForm = document.getElementById('form-' + tab);
  if (targetForm) targetForm.classList.add('active');
}

// ===== REGISTER =====
async function doRegister() {
  const username = document.getElementById('reg-username').value.trim();
  const name = document.getElementById('reg-name').value.trim();
  const age = document.getElementById('reg-age').value.trim();
  const phone = document.getElementById('reg-phone').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const domain = document.getElementById('reg-domain').value;
  const msgEl = document.getElementById('reg-msg');
  const btn = document.getElementById('regBtn');

  if(!username || !name || !age || !phone || !email || !password || !domain) {
    msgEl.className='form-msg error';msgEl.textContent='Please fill in all required fields.';return;
  }
  if(password.length < 6) {
    msgEl.className='form-msg error';msgEl.textContent='Password must be at least 6 characters.';return;
  }

  btn.disabled=true;btn.textContent='Creating account...';
  msgEl.className='form-msg';msgEl.textContent='';

  try {
    // 1. Check if username is already taken
    const { data: existingUser, error: checkError } = await sbClient
      .from('registrations')
      .select('username')
      .eq('username', username)
      .maybeSingle();
      
    if (checkError) throw checkError;
    if (existingUser) {
      throw new Error('User ID / Username is already taken. Please choose another.');
    }

    // 2. Sign up in Supabase auth
    const {data, error} = await sbClient.auth.signUp({
      email,
      password,
      options: { 
        data: { 
          full_name: name,
          username: username,
          age: parseInt(age),
          phone_number: phone,
          career_domain: domain
        } 
      }
    });
    if(error) throw error;
    
    // 3. Insert into registrations table
    if (data && data.user) {
      const { error: regError } = await sbClient.from('registrations').upsert([
        { 
          id: data.user.id, 
          username,
          name, 
          email, 
          phone_number: phone, 
          age: parseInt(age), 
          career_domain: domain 
        }
      ]);
      if (regError) throw regError;
    }

    msgEl.className='form-msg success';
    msgEl.textContent='🎉 Registration successful! Please check your email inbox to verify your account. We will contact you shortly to schedule your session.';
    btn.textContent='Registration Successful!';
  } catch(err) {
    msgEl.className='form-msg error';
    msgEl.textContent = err.message || 'Registration failed. Please try again.';
    btn.disabled=false;btn.textContent='Register & Book Session';
  }
}

// ===== LOGIN =====
async function doLogin() {
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  const msgEl = document.getElementById('login-msg');
  const btn = document.getElementById('loginBtn');

  if(!username || !password) {
    msgEl.className='form-msg error';
    msgEl.textContent='Please enter username and password.';
    return;
  }

  btn.disabled=true;btn.textContent='Signing in...';
  msgEl.className='form-msg';msgEl.textContent='';

  try {
    // Look up email by username using public.get_email_by_username
    const { data: email, error: rpcError } = await sbClient.rpc('get_email_by_username', { username: username });
    if (rpcError) throw rpcError;
    if (!email) throw new Error('No account found with that User ID / Username. Please check and try again.');

    const {data, error} = await sbClient.auth.signInWithPassword({email, password});
    if(error) throw error;

    msgEl.className='form-msg success';msgEl.textContent='Welcome back! You are now signed in.';
    btn.textContent='Signed In ✓';
    setTimeout(closeModal, 1500);
  } catch(err) {
    msgEl.className='form-msg error';
    msgEl.textContent = err.message || 'Sign in failed. Check your credentials.';
    btn.disabled=false;btn.textContent='Sign In';
  }
}

// ===== GOOGLE OAUTH =====
async function loginWithGoogle() {
  const msgEl = document.getElementById('login-msg') || document.getElementById('reg-msg');
  try {
    const { error } = await sbClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + window.location.pathname
      }
    });
    if(error) throw error;
  } catch(err) {
    if (msgEl) {
      msgEl.className='form-msg error';
      msgEl.textContent = err.message || 'Google OAuth failed.';
    } else {
      alert(err.message || 'Google OAuth failed.');
    }
  }
}

// ===== COMPLETE PROFILE =====
async function doCompleteProfile() {
  const name = document.getElementById('complete-name').value.trim();
  const age = document.getElementById('complete-age').value.trim();
  const phone = document.getElementById('complete-phone').value.trim();
  const domain = document.getElementById('complete-domain').value;
  const msgEl = document.getElementById('complete-msg');
  const btn = document.getElementById('completeBtn');

  if (!name || !age || !phone || !domain) {
    msgEl.className='form-msg error';
    msgEl.textContent='Please fill in all required fields.';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Saving...';
  msgEl.className = 'form-msg';
  msgEl.textContent = '';

  try {
    const { data: { user }, error: userError } = await sbClient.auth.getUser();
    if (userError || !user) throw new Error('No user is currently logged in.');

    // 1. Update Auth User Metadata
    const { error: userUpdateError } = await sbClient.auth.updateUser({
      data: {
        full_name: name,
        age: parseInt(age),
        phone_number: phone,
        career_domain: domain
      }
    });
    if (userUpdateError) throw userUpdateError;

    // 2. Update Registrations Table
    const { error: updateError } = await sbClient.from('registrations').upsert({
      id: user.id,
      name,
      email: user.email,
      phone_number: phone,
      age: parseInt(age),
      career_domain: domain
    });
    if (updateError) throw updateError;

    msgEl.className='form-msg success';
    msgEl.textContent='✅ Profile completed successfully!';
    btn.textContent='Profile Saved ✓';
    setTimeout(() => {
      closeModal();
    }, 1500);
  } catch (err) {
    msgEl.className='form-msg error';
    msgEl.textContent = err.message || 'Failed to complete profile. Try again.';
    btn.disabled = false;
    btn.textContent = 'Save & Continue';
  }
}

// ===== CONTACT FORM =====
async function submitContact(e) {
  e.preventDefault();
  const btn = document.getElementById('cfSubmit');
  const msgEl = document.getElementById('cf-msg-status');
  btn.disabled=true;btn.textContent='Sending...';

  const name = document.getElementById('cf-name').value;
  const phone = document.getElementById('cf-phone').value;
  const email = document.getElementById('cf-email').value;
  const req = document.getElementById('cf-req').value;
  const msg = document.getElementById('cf-msg').value;

  try {
    // Store in Supabase
    const {error} = await sbClient.from('contact_enquiries').insert([{
      name,
      phone_number: phone,
      email,
      requirement: req,
      query_message: msg
    }]);
    if (error) throw error;

    msgEl.className='form-msg success';
    msgEl.textContent='✅ Thank you! Your message has been sent. We will reach out within 24 hours.';
    document.getElementById('contactForm').reset();
    btn.textContent='Message Sent ✓';
  } catch(err) {
    console.error('Contact Form Error:', err);
    msgEl.className='form-msg error';
    msgEl.textContent='❌ Failed to send message. Please check your connection and try again.';
    btn.disabled=false;
    btn.textContent='Send Message';
  }
}
