// handlers/profiles.js
const fs = require('fs');
const path = require('path');

const profilesPath = path.join(__dirname, '../data/profiles.json');

if (!fs.existsSync(profilesPath)) {
  fs.writeFileSync(profilesPath, JSON.stringify({}));
}

module.exports = (bot) => {
  bot.command('profiles', (ctx) => {
    const userId = ctx.from.id.toString();
    const profiles = JSON.parse(fs.readFileSync(profilesPath));
    const userProfiles = profiles[userId] || [];

    if (userProfiles.length === 0) {
      ctx.reply('📭 You have no saved profiles. Send your card & address in this format:\n\n`John Doe, 123 Sneaker St, London, W1A 1AA, 1234 5678 9012 3456, 01/25, 123`', {
        parse_mode: 'Markdown'
      });
    } else {
      const formatted = userProfiles.map((p, i) => `#${i + 1} – ${p.name}, ends in ${p.card.slice(-4)}`).join('\n');
      ctx.reply(`📦 Your Profiles:\n\n${formatted}`, { parse_mode: 'Markdown' });
    }
  });

  bot.on('text', (ctx) => {
    const message = ctx.message.text;
    const parts = message.split(',').map(p => p.trim());

    if (parts.length !== 7) return;

    const [name, address, city, postcode, card, expiry, cvv] = parts;
    const userId = ctx.from.id.toString();
    const profiles = JSON.parse(fs.readFileSync(profilesPath));

    const profile = {
      name,
      address,
      city,
      postcode,
      card,
      expiry,
      cvv
    };

    if (!profiles[userId]) profiles[userId] = [];
    profiles[userId].push(profile);

    fs.writeFileSync(profilesPath, JSON.stringify(profiles, null, 2));

    ctx.reply(`✅ Profile saved for *${name}* ending in *${card.slice(-4)}*`, { parse_mode: 'Markdown' });
  });
};
