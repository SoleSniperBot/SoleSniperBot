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
      `📧 *IMAP Setup Guide* (For Nike 2FA Email Codes)

1. Find your IMAP credentials (email, IMAP server, port).
2. Generate an *App Password* (required for Gmail, iCloud, etc).
3. Use this format:
\`/saveimap email@example.com:password:imap.server.com:993\`

✅ Example:
\`/saveimap test@gmail.com:abcd1234:imap.gmail.com:993\`

_Add a SOCKS5 proxy (optional):_
\`/saveimap email:pass:imap:993:socks5host:port\`

Need help? DM [@badmandee1](https://t.me/badmandee1)`,
      { parse_mode: 'Markdown', disable_web_page_preview: true }
    );
  });

  bot.command('saveimap', (ctx) => {
    const input = ctx.message.text.split(' ')[1];
    if (!input) {
      return ctx.reply('⚠️ Usage:\n/saveimap email:pass:imap:port[:proxyhost:proxyport]');
    }

    const parts = input.split(':');
    if (parts.length < 4) {
      return ctx.reply('❌ Missing required values. Format:\nemail:pass:imap:port[:proxyhost:proxyport]');
    }

    const [email, pass, imapHost, imapPort, proxyHost, proxyPort] = parts;

    const data = JSON.parse(fs.readFileSync(imapPath, 'utf8'));
    data[ctx.from.id] = {
      email,
      pass,
      imapHost,
      imapPort,
      proxy: proxyHost && proxyPort ? `${proxyHost}:${proxyPort}` : null
    };

    fs.writeFileSync(imapPath, JSON.stringify(data, null, 2));
    ctx.reply('✅ IMAP settings saved for Nike account verification.');
  });
};
