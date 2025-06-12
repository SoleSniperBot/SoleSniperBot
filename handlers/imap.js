// handlers/imap.js
const fs = require('fs');
const path = require('path');

const imapPath = path.join(__dirname, '../data/imap.json');

if (!fs.existsSync(imapPath)) {
  fs.writeFileSync(imapPath, JSON.stringify({}));
}

module.exports = (bot) => {
  bot.command('imap', (ctx) => {
    ctx.reply(
      `📧 *IMAP Setup Guide* (For Nike 2FA email codes)

To autofetch 2FA codes from your inbox:
1. Find your IMAP credentials (email, IMAP server, port).
2. Generate an *App Password* (if using Gmail, iCloud, Yahoo).
3. Use this format to send in chat:
\`/saveimap email@example.com:password:imap.server.com:993\`

✅ Example:
\`/saveimap test@gmail.com:abcd1234:imap.gmail.com:993\`

_You can also add a SOCKS5 proxy at the end like this:_
\`/saveimap email:pass:imap.server.com:993:socks5host:port\`

Need help? Message the admin or join the Telegram support group.`,
      { parse_mode: 'Markdown' }
    );
  });

  bot.command('saveimap', (ctx) => {
    const text = ctx.message.text.split(' ')[1];
    if (!text) {
      return ctx.reply('⚠️ Format incorrect. Try: /saveimap email:pass:imap:port');
    }

    const [email, pass, imapHost, imapPort, proxyHost, proxyPort] = text.split(':');
    if (!email || !pass || !imapHost || !imapPort) {
      return ctx.reply('❌ Missing values. Must be: email:pass:imap:port');
    }

    const data = JSON.parse(fs.readFileSync(imapPath));
    data[ctx.from.id] = {
      email,
      pass,
      imapHost,
      imapPort,
      proxy: proxyHost && proxyPort ? `${proxyHost}:${proxyPort}` : null
    };

    fs.writeFileSync(imapPath, JSON.stringify(data, null, 2));
    ctx.reply('✅ IMAP settings saved successfully.');
  });
};
