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

// Helper to validate expiry date MM/YY format and that it's not expired
function isValidExpiry(exp) {
  if (!/^\d{2}\/\d{2}$/.test(exp)) return false;
  const [month, year] = exp.split('/').map(Number);
  if (month < 1 || month > 12) return false;

  const now = new Date();
  const currentYear = now.getFullYear() % 100; // last two digits
  const currentMonth = now.getMonth() + 1;

  if (year < currentYear) return false;
  if (year === currentYear && month < currentMonth) return false;

  return true;
}

// Helper to validate card number (basic length and digits only)
function isValidCardNumber(card) {
  const cleanCard = card.replace(/\s/g, '');
  return /^\d{13,19}$/.test(cleanCard);
}

module.exports = (bot) => {
  bot.command('profiles', (ctx) => {
    const userId = ctx.from.id;
    const userProfiles = profiles[userId] || [];

    if (userProfiles.length === 0) {
      return ctx.reply(
        '👤 No profiles found.\nSend your profile in the format:\n`Name | Card Number | Exp (MM/YY) | CVV | Address`',
        { parse_mode: 'Markdown' }
      );
    }

    const formatted = userProfiles
      .map(
        (p, i) =>
          `#${i + 1} - ${p.name}\n💳 ${p.card} (Exp: ${p.exp})\n🏠 ${p.address}`
      )
      .join('\n\n');
    ctx.replyWithMarkdown(`📦 Your Profiles:\n\n${formatted}`);
  });

  bot.on('text', (ctx) => {
    const userId = ctx.from.id;
    const input = ctx.message.text.trim();

    // Match profile pattern: Name | Card | Exp | CVV | Address
    const regex = /^(.+)\s\|\s([\d\s]+)\s\|\s(\d{2}\/\d{2})\s\|\s(\d{3,4})\s\|\s(.+)$/;
    const match = input.match(regex);

    if (!match) return; // Ignore if format doesn't match

    const [_, name, card, exp, cvv, address] = match;

    // Validate card number and expiry date
    if (!isValidCardNumber(card)) {
      return ctx.reply('❌ Invalid card number. Please enter 13 to 19 digits.');
    }
    if (!isValidExpiry(exp)) {
      return ctx.reply('❌ Invalid or expired expiry date. Use MM/YY format.');
    }
    if (!/^\d{3,4}$/.test(cvv)) {
      return ctx.reply('❌ Invalid CVV. Must be 3 or 4 digits.');
    }

    const profile = { name, card, exp, cvv, address };

    if (!profiles[userId]) profiles[userId] = [];
    profiles[userId].push(profile);
    saveProfiles();

    ctx.reply('✅ Profile saved successfully!');
  });
};
