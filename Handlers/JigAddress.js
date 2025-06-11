const fs = require('fs');
const path = require('path');

function jigAddress(original, region = 'UK') {
  const variations = [
    'Flat A', 'Flat B', 'Unit 1', 'Apt 2', 'Suite 3', 'Room 4', '',
    'Building 5', 'Floor 2', 'Level 1', 'Block C'
  ];
  const randomSuffix = variations[Math.floor(Math.random() * variations.length)];

  if (region === 'UK') {
    const lines = original.split(',');
    if (lines.length >= 2) {
      lines[0] = `${lines[0].trim()} ${randomSuffix}`.trim();
      return lines.join(', ');
    }
  } else if (region === 'US') {
    const parts = original.split(',');
    if (parts.length >= 2) {
      parts[1] = `${parts[1].trim()} ${randomSuffix}`.trim(); // Add variation to address line 2
      return parts.join(', ');
    }
  }

  return `${original} ${randomSuffix}`.trim();
}

module.exports = async function handleJigAddressCommand(ctx) {
  const userId = String(ctx.from.id);
  const profilesPath = path.join(__dirname, '..', 'Data', 'Profiles.json');

  try {
    if (!fs.existsSync(profilesPath)) {
      return ctx.reply('❌ No profiles found. Please create one first.');
    }

    const profilesData = JSON.parse(fs.readFileSync(profilesPath));
    const userProfiles = profilesData[userId];

    if (!userProfiles || userProfiles.length === 0) {
      return ctx.reply('⚠️ You haven’t added any drop addresses yet. Use /addprofile first.');
    }

    const jigs = userProfiles.map(profile => {
      const region = profile.country === 'US' ? 'US' : 'UK';
      const originalAddress = profile.address;
      const jiggedAddress = jigAddress(originalAddress, region);

      return `🔁 *Original*: ${originalAddress}\n✏️ *Jigged*: ${jiggedAddress}`;
    });

    ctx.reply(jigs.join('\n\n'), { parse_mode: 'Markdown' });
  } catch (err) {
    console.error(err);
    ctx.reply('❌ Error reading profiles. Try again later.');
  }
};
