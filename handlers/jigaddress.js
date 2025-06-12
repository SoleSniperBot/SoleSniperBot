// handlers/jigaddress.js
const fs = require('fs');
const path = require('path');

const profilesPath = path.join(__dirname, '../data/profiles.json');

if (!fs.existsSync(profilesPath)) {
  fs.writeFileSync(profilesPath, JSON.stringify({}));
}

module.exports = (bot) => {
  bot.command('jigaddress', (ctx) => {
    const userId = ctx.from.id;
    const data = JSON.parse(fs.readFileSync(profilesPath));
    const userProfiles = data[userId];

    if (!userProfiles || userProfiles.length === 0) {
      return ctx.reply('❌ You have no profiles saved. Use /profiles to add one.');
    }

    const jigs = userProfiles.map((p, i) => {
      const jigged = {
        ...p,
        address1: `${Math.floor(Math.random() * 9999)} ${p.address1}`,
        postcode: p.postcode.replace(/[0-9]/g, (d) => (parseInt(d) + 1) % 10)
      };
      return `#${i + 1}:\nName: ${jigged.name}\nAddress: ${jigged.address1}, ${jigged.postcode}`;
    });

    ctx.reply(`📦 *Jigged Addresses:*\n\n${jigs.join('\n\n')}`, { parse_mode: 'Markdown' });
  });
};
