const fs = require('fs');
const profilesPath = './Data/Profiles.json';

module.exports = async function handleSaveJig(ctx) {
  const userId = ctx.from?.id;
  const text = ctx.message?.text?.split(' ').slice(1);
  if (!text || text.length < 2) {
    return ctx.reply('❌ Usage: /savejig [profileName] [newJiggedAddress]');
  }

  const [profileName, ...jiggedParts] = text;
  const newJiggedAddress = jiggedParts.join(' ').trim();

  let profiles = {};
  if (fs.existsSync(profilesPath)) {
    profiles = JSON.parse(fs.readFileSync(profilesPath));
  }

  if (!profiles[userId] || !profiles[userId][profileName]) {
    return ctx.reply('❌ Profile not found for your account.');
  }

  profiles[userId][profileName].address = newJiggedAddress;

  fs.writeFileSync(profilesPath, JSON.stringify(profiles, null, 2));
  ctx.reply(`✅ Jigged address for "${profileName}" has been updated.`);
};
