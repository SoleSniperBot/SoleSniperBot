// handlers/cards.js
const fs = require('fs');
const path = require('path');

const profilesPath = path.join(__dirname, '../data/profiles.json');

if (!fs.existsSync(profilesPath)) {
  fs.writeFileSync(profilesPath, JSON.stringify({}));
}

let profiles = JSON.parse(fs.readFileSync(profilesPath, 'utf8'));

function saveProfiles() {
  fs.writeFileSync(profilesPath, JSON.stringify(profiles, null, 2));
}

module.exports = (bot) => {
  bot.command('profiles', (ctx) => {
    const userId = ctx.from.id;
    const userProfiles = profiles[userId] || [];

    if (userProfiles.length === 0) {
      return ctx.reply('👤 No profiles found.\nSend your profile in the format:\n`Name | Card | Exp | CVV | Address`', { parse_mode: 'Markdown' });
    }

    const formatted = userProfiles.map((p, i) => `#${i + 1} - ${p.name}\n💳 ${p.card} (${p.exp})\n🏠 ${p.address}`).join('\n\n');
    ctx.replyWithMarkdown(`📦 Your Profiles:\n\n${formatted}`);
  });

  bot.on('text', (ctx) => {
    const userId = ctx.from.id;
    const input = ctx.message.text;

    // Match profile pattern
    const regex = /^(.+)\s\|\s([\d\s]+)\s\|\s(\d{2}\/\d{2})\s\|\s(\d{3,4})\s\|\s(.+)$/;
    const match = input.match(regex);

    if (!match) return;

    const [_, name, card, exp, cvv, address] = match;

    const profile = { name, card, exp, cvv, address };

    if (!profiles[userId]) profiles[userId] = [];
    profiles[userId].push(profile);
    saveProfiles();

    ctx.reply('✅ Profile saved!');
  });
};
