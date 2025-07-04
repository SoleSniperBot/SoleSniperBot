// lib/nikeApi.js

async function createNikeSession(email, password, proxy) {
  console.log(`📲 [Mock] Creating session for ${email} via proxy ${proxy?.ip || 'no proxy'}`);
  // Fake session object (mimics successful creation)
  return {
    email,
    sessionToken: `session-${Date.now()}-${Math.floor(Math.random() * 1000)}`
  };
}

async function confirmNikeEmail(session, code) {
  console.log(`✅ [Mock] Confirming Nike email for ${session.email} with code ${code}`);
  // Always returns true (success)
  return true;
}

module.exports = {
  createNikeSession,
  confirmNikeEmail
};
