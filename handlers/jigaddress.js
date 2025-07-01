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
    const data = JSON.parse(fs.readFileSync(profilesPath, 'utf8'));
    const userProfiles = data[userId];

    if (!userProfiles || userProfiles.length === 0) {
      return ctx.reply('❌ You have no profiles saved. Use /profiles to add one.');
    }

    const jigs = userProfiles.map((p, i) => {
      // Assume p.address is full address string; no separate address1/postcode
      // If you want jigged street number, split address at first space
      let jiggedAddress = p.address;
      if (typeof p.address === 'string') {
        const parts = p.address.split(' ');
        if (parts.length > 1) {
          const num = Math.floor(Math.random() * 9999);
          parts[0] = num.toString();
          jiggedAddress = parts.join(' ');
        }
      }

      // Jig postcode if exists and is string
      let jiggedPostcode = p.postcode;
      if (typeof p.postcode === 'string') {
        jiggedPostcode = p.postcode.replace(/[0-9]/g, (d) => (parseInt(d) + 1) % 10);
      }

      return `#${i + 1}:\nName: ${p.name}\nAddress: ${jiggedAddress}${jiggedPostcode ? ', ' + jiggedPostcode : ''}`;
    });

    ctx.reply(`📦 *Jigged Addresses:*\n\n${jigs.join('\n\n')}`, { parse_mode: 'Markdown' });
  });
};
