const fs = require('fs');
const path = require('path');
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

      profiles[ctx2.from.id] = {
        name: parts[0].trim(),
        address: parts[1].trim(),
        city: parts[2].trim(),
        postcode: parts[3].trim(),
        phone: parts[4].trim(),
        card: parts[5].trim(),
        exp: parts[6].trim(),
        cvv: parts[7].trim(),
      };

      fs.writeFileSync(profilesPath, JSON.stringify(profiles, null, 2));
      ctx2.reply('✅ Profile saved successfully!');
    });
  });
};

// Export a helper function to get user profiles
module.exports.getUserProfiles = function(userId) {
  return profiles[userId] ? [profiles[userId]] : [];
};
