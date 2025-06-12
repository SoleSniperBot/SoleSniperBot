// handlers/savejiggedaddress.js
const fs = require('fs');
const path = require('path');

const jiggedPath = path.join(__dirname, '../data/jigged.json');

if (!fs.existsSync(jiggedPath)) {
  fs.writeFileSync(jiggedPath, JSON.stringify({}));
}

module.exports = (bot) => {
  bot.command('savejig', (ctx) => {
    ctx.reply(
      '🧪 Send your jigged address in this format:\n\n`Home 1, 123 Sneaker St, London, W1A 1AA`',
      { parse_mode: 'Markdown' }
    );
  });

  bot.on('text', (ctx) => {
    const msg = ctx.message.text;
    if (!msg.includes(',') || msg.startsWith('/')) return;

    const [label, line1, cityPostcode] = msg.split(',').map((p) => p.trim());
    if (!label || !line1 || !cityPostcode) return;

    const userId = ctx.from.id.toString();
    const allJigged = JSON.parse(fs.readFileSync(jiggedPath));
    if (!allJigged[userId]) allJigged[userId] = [];

    const newEntry = { label, line1, cityPostcode };
    allJigged[userId].push(newEntry);

    fs.writeFileSync(jiggedPath, JSON.stringify(allJigged, null, 2));

    ctx.reply(`✅ Jigged address *${label}* saved!`, { parse_mode: 'Markdown' });
  });
};
