const domain = process.env.DOMAIN;

bot.launch().then(() => {
  console.log('🤖 Telegram bot launched via polling');

  // Delay webhook set by 5 seconds to let Railway expose domain
  setTimeout(() => {
    const webhookURL = `${domain}/bot${process.env.BOT_TOKEN}`;
    bot.telegram.setWebhook(webhookURL)
      .then(() => console.log(`🤖 Webhook set to: ${webhookURL}`))
      .catch(err => console.error('❌ Failed to set webhook:', err.message));
  }, 5000); // 5 second delay
});
