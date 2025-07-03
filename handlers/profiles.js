const fs = require('fs');
const path = require('path');
const { Markup } = require('telegraf');

// Create UK shoe size buttons from UK 3 to UK 12.5
const sizes = [];
for (let i = 3; i <= 12.5; i += 0.5) {
  sizes.push(`UK ${i % 1 === 0 ? i : i.toFixed(1)}`);
}

const sizeButtons = [];
for (let i = 0; i < sizes.length; i += 3) {
  sizeButtons.push([
    Markup.button.callback(sizes[i], `size_${sizes[i]}`),
    sizes[i + 1] && Markup.button.callback(sizes[i + 1], `size_${sizes[i + 1]}`),
    sizes[i + 2] && Markup.button.callback(sizes[i + 2], `size_${sizes[i + 2]}`)
  ].filter(Boolean));
}

const sizeKeyboard = Markup.inlineKeyboard(sizeButtons);
const profilesPath = path.join(__dirname, '../data/profiles.json');

// Load or init profiles file
let profiles = {};
if (fs.existsSync(profilesPath)) {
  profiles = JSON.parse(fs.readFileSync(profilesPath, 'utf8'));
}

module.exports = (bot) => {
  bot.action('add_profile', async (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('📝 Send your profile in this format:\n`Name, Address, City, Postcode, Phone, CardNumber, Exp, CVV`', {
      parse_mode: 'Markdown'
    });

    bot.once('text', async (ctx2) => {
      const parts = ctx2.message.text.split(',');
      if (parts.length !== 8) {
        return ctx2.reply('❌ Incorrect format. Make sure you include 8 comma-separated values.');
      }

      const newProfile = {
        name: parts[0].trim(),
        address: parts[1].trim(),
        city: parts[2].trim(),
        postcode: parts[3].trim(),
        phone: parts[4].trim(),
        card: parts[5].trim(),
        exp: parts[6].trim(),
        cvv: parts[7].trim(),
      };

      if (!profiles[ctx2.from.id]) {
        profiles[ctx2.from.id] = [];
      }
      profiles[ctx2.from.id].push(newProfile);

      fs.writeFileSync(profilesPath, JSON.stringify(profiles, null, 2));
      ctx2.reply('✅ Profile saved successfully! You can add more or view your profiles.');
    });
  });
};

// Export helper to get all profiles for a user
module.exports.getUserProfiles = function(userId) {
  return profiles[userId] || [];
};
