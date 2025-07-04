const fs = require('fs');
const path = require('path');
const { Markup } = require('telegraf');

const profilesPath = path.join(__dirname, '../data/profiles.json');
let profiles = fs.existsSync(profilesPath)
  ? JSON.parse(fs.readFileSync(profilesPath, 'utf8'))
  : {};

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

module.exports = (bot) => {
  // ➕ Add profile
  bot.action('add_profile', async (ctx) => {
    ctx.answerCbQuery();
    await ctx.reply('📝 Send your profile in this format:\n`Name, Address, City, Postcode, Phone, CardNumber, Exp, CVV`', {
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
        shoeSize: null,
        gender: null
      };

      if (!profiles[ctx2.from.id]) {
        profiles[ctx2.from.id] = [];
      }
      profiles[ctx2.from.id].push(newProfile);
      fs.writeFileSync(profilesPath, JSON.stringify(profiles, null, 2));

      ctx2.reply('✅ Profile saved. Now choose a shoe size:', sizeKeyboard);
    });
  });

  // 👟 Set shoe size
  bot.action(/size_UK (.+)/, async (ctx) => {
    const userId = String(ctx.from.id);
    const selectedSize = ctx.match[1];

    if (profiles[userId] && profiles[userId].length > 0) {
      const latest = profiles[userId][profiles[userId].length - 1];
      latest.shoeSize = `UK ${selectedSize}`;
      fs.writeFileSync(profilesPath, JSON.stringify(profiles, null, 2));
      ctx.reply(`👟 Shoe size set to UK ${selectedSize}. Now set gender:`, Markup.inlineKeyboard([
        [Markup.button.callback('👨 Male', 'gender_male'), Markup.button.callback('👩 Female', 'gender_female')]
      ]));
    } else {
      ctx.reply('⚠️ No profile found to attach this size.');
    }
  });

  // ⚥ Set gender
  bot.action(/gender_(male|female)/, async (ctx) => {
    const userId = String(ctx.from.id);
    const gender = ctx.match[1];

    if (profiles[userId] && profiles[userId].length > 0) {
      const latest = profiles[userId][profiles[userId].length - 1];
      latest.gender = gender;
      fs.writeFileSync(profilesPath, JSON.stringify(profiles, null, 2));
      ctx.reply(`✅ Gender set to ${gender.charAt(0).toUpperCase() + gender.slice(1)}. Profile complete!`);
    } else {
      ctx.reply('⚠️ No profile found to update gender.');
    }
  });
};

module.exports.getUserProfiles = (userId) => profiles[userId] || [];
