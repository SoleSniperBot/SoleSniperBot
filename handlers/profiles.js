const fs = require('fs');
const path = require('path');
const profilePath = path.join(__dirname, '../data/profiles.json');

module.exports = (bot) => {
  bot.command('profiles', (ctx) => {
    if (!fs.existsSync(profilePath)) {
      return ctx.reply('❌ No profiles found.');
    }
    const profiles = JSON.parse(fs.readFileSync(profilePath));
    ctx.reply(`📋 Profiles:\n${Object.keys(profiles).join('\n')}`);
  });
};
