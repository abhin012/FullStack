// MOCK SMS PROVIDER — replace this with a real Twilio (or similar) integration
// when ready to send actual text messages. Swap point: just change the body
// of sendSMSOTP to call your SMS provider's API instead of console.log.
export const sendSMSOTP = async ({ to, code, language }) => {
  console.log(`📱 [MOCK SMS] To: ${to} | Your CodeQuest verification code is: ${code} (switching to ${language})`);
  // In dev/mock mode we don't actually fail — this always "succeeds"
  return true;
};