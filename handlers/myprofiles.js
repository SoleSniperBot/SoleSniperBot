const fs = require('fs');
const path = require('path');
const profilesPath = path.join(__dirname, '../data/profiles.json');

// Load profiles file
let profiles = {};
if (fs.existsSync(profilesPath)) {
  profiles = JSON.parse(fs.readFileSync(profilesPath, 'utf8'));
}

module.exports = (bot) => {
  // Command to list all profiles
  bot.command('myprofiles', (ctx) => {
    const userId = ctx.from.id;
    const userProfiles = profiles[userId];

    if (!userProfiles || userProfiles.length === 0) {
      return ctx.reply('👤 You have no profiles saved. Use the inline button or /addprofile to add one.');
    }

    let reply = `📂 *Your Saved Profiles:*\n\n`;

    userProfiles.forEach((p, i) => {
      reply += `#${i + 1}\n`;
      reply += `👤 Name: ${p.name}\n`;
      reply += `🏠 Address: ${p.address}, ${p.city}, ${p.postcode}\n`;
      reply += `📞 Phone: ${p.phone}\n`;
      reply += `💳 Card: ${p.card} (Exp: ${p.exp}, CVV: ${p.cvv})\n\n`;
    });

    ctx.replyWithMarkdown(reply);
  });
};
