const fs = require('fs');
const vipList = JSON.parse(fs.readFileSync('./Data/Vip.json'));
const userId = ctx.from?.id || ctx.message?.from?.id;

if (!vipList.includes(userId)) {
  return ctx.reply('🚫 This feature is only available to SoleSniper Pro+ members. Upgrade with /upgradepro 🔐');
}
module.exports = async function handleIMAP(ctx) {
  const instructions = `
🛡️ *IMAP Autofetch Setup for Nike 2FA*

To enable automatic fetching of 2FA codes from your email inbox, follow these steps:

1. Go to your email provider and enable IMAP access.
2. Generate an *App Password* if your email requires it (e.g., Gmail).
3. Send your details in this format:

\`\`\`
IMAP Email: your@email.com
Password: yourapppassword
Host: imap.emailprovider.com
Port: 993
Use Proxy (optional): IP:PORT:USER:PASS
\`\`\`

_Need help finding these? Use the FAQ guide or ask us directly._

This will allow SoleSniperBot to automatically log in to all your Nike accounts 🔥
`;

  await ctx.replyWithMarkdown(instructions);
};
