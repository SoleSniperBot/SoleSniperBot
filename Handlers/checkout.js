module.exports = async function handleCheckout(ctx) {
  ctx.reply(
    '🛒 Let’s get you set up for Auto-Checkout!\n\n' +
    'Use /addaccount to connect Nike, JD, etc.\n' +
    'Use /addprofile to save your address & card info.\n\n' +
    'Once ready, you’ll be able to snipe releases using your profiles and proxies 💸'
  );
};
