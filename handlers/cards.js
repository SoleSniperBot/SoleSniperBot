const fs = require('fs');
const path = require('path');
const { Markup } = require('telegraf');

const profilesPath = path.join(__dirname, '../data/profiles.json');

if (!fs.existsSync(profilesPath)) {
  fs.writeFileSync(profilesPath, JSON.stringify({}));
}

let profiles = JSON.parse(fs.readFileSync(profilesPath, 'utf8'));

function saveProfiles() {
  fs.writeFileSync(profilesPath, JSON.stringify(profiles, null, 2));
}

function isValidExpiry(exp) {
  if (!/^\d{2}\/\d{2}$/.test(exp)) return false;
  const [month, year] = exp.split('/').map(Number);
  if (month < 1 || month > 12) return false;

  const now = new Date();
  const currentYear = now.getFullYear() % 100;
  const currentMonth = now.getMonth() + 1;

  if (year < currentYear) return false;
  if (year === currentYear && month < currentMonth) return false;

  return true;
}

function isValidCardNumber(card) {
  const cleanCard = card.replace(/\s/g, '');
  return /^\d{13,19}$/.test(cleanCard);
}

module.exports = (bot) => {
  // Show profiles with inline buttons
  bot.command('profiles', (ctx) => {
    const userId = ctx.from.id;
    const userProfiles = profiles[userId] || [];

    if (userProfiles.length === 0) {
      return ctx.reply(
        '👤 No profiles found.\nSend your profile in the format:\n`Name | Card Number | Exp (MM/YY) | CVV | Address`',
        { parse_mode: 'Markdown' }
      );
    }

    userProfiles.forEach((p, i) => {
      const text = `#${i + 1} - ${p.name}\n💳 ${p.card} (Exp: ${p.exp})\n🏠 ${p.address}`;
      const inlineKeyboard = Markup.inlineKeyboard([
        [
          Markup.button.callback('✏️ Edit', `editprofile_${i}`),
          Markup.button.callback('🗑️ Delete', `deleteprofile_${i}`)
        ]
      ]);
      ctx.reply(text, inlineKeyboard);
    });
  });

  // Add profile by text input
  bot.on('text', (ctx) => {
    const userId = ctx.from.id;
    const input = ctx.message.text.trim();

    const regex = /^(.+)\s\|\s([\d\s]+)\s\|\s(\d{2}\/\d{2})\s\|\s(\d{3,4})\s\|\s(.+)$/;
    const match = input.match(regex);
    if (!match) return;

    const [_, name, card, exp, cvv, address] = match;

    if (!isValidCardNumber(card)) {
      return ctx.reply('❌ Invalid card number. Please enter 13 to 19 digits.');
    }
    if (!isValidExpiry(exp)) {
      return ctx.reply('❌ Invalid or expired expiry date. Use MM/YY format.');
    }
    if (!/^\d{3,4}$/.test(cvv)) {
      return ctx.reply('❌ Invalid CVV. Must be 3 or 4 digits.');
    }

    if (!profiles[userId]) profiles[userId] = [];
    profiles[userId].push({ name, card, exp, cvv, address });
    saveProfiles();

    ctx.reply('✅ Profile saved successfully!');
  });

  // Handle inline delete button
  bot.action(/deleteprofile_(\d+)/, (ctx) => {
    const userId = ctx.from.id;
    const index = parseInt(ctx.match[1], 10);

    if (!profiles[userId] || index < 0 || index >= profiles[userId].length) {
      return ctx.answerCbQuery('⚠️ Profile not found.', { show_alert: true });
    }

    const removed = profiles[userId].splice(index, 1);
    saveProfiles();

    ctx.answerCbQuery('🗑️ Profile deleted.');
    ctx.editMessageText(`Deleted profile:\n\n${removed[0].name}`);

  });

  // Handle inline edit button — start conversation for editing
  bot.action(/editprofile_(\d+)/, async (ctx) => {
    const userId = ctx.from.id;
    const index = parseInt(ctx.match[1], 10);

    if (!profiles[userId] || index < 0 || index >= profiles[userId].length) {
      return ctx.answerCbQuery('⚠️ Profile not found.', { show_alert: true });
    }

    ctx.answerCbQuery();

    const profile = profiles[userId][index];

    await ctx.reply(
      `✏️ Editing profile #${index + 1} - ${profile.name}\n\n` +
      'Please send the updated profile details in this format:\n' +
      '`Name | Card Number | Exp (MM/YY) | CVV | Address`',
      { parse_mode: 'Markdown' }
    );

    // Set user state for editing (basic in-memory, could be improved)
    if (!bot.context) bot.context = {};
    bot.context[userId] = { editingIndex: index };
  });

  // Listen for updated profile text when user is editing
  bot.on('text', (ctx, next) => {
    const userId = ctx.from.id;
    if (!bot.context || !bot.context[userId] || bot.context[userId].editingIndex === undefined) {
      return next();
    }

    const index = bot.context[userId].editingIndex;
    const input = ctx.message.text.trim();

    const regex = /^(.+)\s\|\s([\d\s]+)\s\|\s(\d{2}\/\d{2})\s\|\s(\d{3,4})\s\|\s(.+)$/;
    const match = input.match(regex);
    if (!match) {
      return ctx.reply('❌ Invalid format. Please send in:\n`Name | Card Number | Exp (MM/YY) | CVV | Address`', { parse_mode: 'Markdown' });
    }

    const [_, name, card, exp, cvv, address] = match;

    if (!isValidCardNumber(card)) {
      return ctx.reply('❌ Invalid card number. Please enter 13 to 19 digits.');
    }
    if (!isValidExpiry(exp)) {
      return ctx.reply('❌ Invalid or expired expiry date. Use MM/YY format.');
    }
    if (!/^\d{3,4}$/.test(cvv)) {
      return ctx.reply('❌ Invalid CVV. Must be 3 or 4 digits.');
    }

    if (!profiles[userId] || index < 0 || index >= profiles[userId].length) {
      return ctx.reply('⚠️ Profile index invalid or no longer exists.');
    }

    profiles[userId][index] = { name, card, exp, cvv, address };
    saveProfiles();

    ctx.reply(`✏️ Profile #${index + 1} updated successfully!`);

    // Clear editing state
    delete bot.context[userId];
  });
};
