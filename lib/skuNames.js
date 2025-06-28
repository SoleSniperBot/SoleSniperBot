const fs = require('fs');
const path = require('path');
const { Markup } = require('telegraf');

const profilesPath = path.join(__dirname, '../data/profiles.json');

// Load or initialize profiles
let profiles = {};
if (fs.existsSync(profilesPath)) {
  profiles = JSON.parse(fs.readFileSync(profilesPath, 'utf8'));
}

function saveProfiles() {
  fs.writeFileSync(profilesPath, JSON.stringify(profiles, null, 2));
}

module.exports = (bot) => {
  // Add Profile Inline Button
  bot.action('add_profile', async (ctx) => {
    ctx.answerCbQuery();
    ctx.reply(
      '📝 Send your profile in this format:\n`Name, Address, City, Postcode, Phone, CardNumber, Exp, CVV`',
      { parse_mode: 'Markdown' }
    );

    bot.once('text', async (ctx2) => {
      const parts = ctx2.message.text.split(',');
      if (parts.length !== 8) {
        return ctx2.reply('❌ Incorrect format. Make sure you include *8* comma-separated values.', { parse_mode: 'Markdown' });
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

      saveProfiles();
      ctx2.reply('✅ Profile saved successfully!');
    });
  });

  // View Profile
  bot.command('myprofile', (ctx) => {
    const profile = profiles[ctx.from.id];
    if (!profile) return ctx.reply('ℹ️ No profile found. Use the inline menu to add one.');

    ctx.reply(
      `👤 *Your Profile Info:*\n` +
      `• Name: ${profile.name}\n` +
      `• Address: ${profile.address}, ${profile.city}, ${profile.postcode}\n` +
      `• Phone: ${profile.phone}\n` +
      `• Card: ${profile.card}\n` +
      `• Exp: ${profile.exp} | CVV: ${profile.cvv}`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('🗑 Delete Profile', 'delete_profile')]
        ])
      }
    );
  });

  // Delete Profile
  bot.action('delete_profile', (ctx) => {
    const userId = ctx.from.id;
    if (profiles[userId]) {
      delete profiles[userId];
      saveProfiles();
      ctx.reply('🗑 Profile deleted.');
    } else {
      ctx.reply('ℹ️ No profile to delete.');
    }
    ctx.answerCbQuery();
  });
};

// Expose helper to get profile
module.exports.getUserProfiles = (userId) => {
  return profiles[userId] ? [profiles[userId]] : [];
};
