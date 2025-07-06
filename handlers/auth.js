const { Markup } = require('telegraf');
const fs = require('fs');
const path = require('path');
const { getLockedProxy } = require('../handlers/proxyManager');

// === Proxy assignment logic ===
const userProxyMap = new Map();
const lockedProxies = new Set();

// Assign fresh proxy for each user
async function assignProxy(userId) {
  const proxy = await getGeoNodeProxy();
  if (!proxy) return null;

  const proxyString = `${proxy.ip}:${proxy.port}:${proxy.username}:${proxy.password}`;
  lockedProxies.add(proxyString);
  userProxyMap.set(userId, proxyString);
  return proxyString;
}

// === Core Inline Menu Handlers ===
module.exports = (bot) => {
  // === Callback: 👟 Generate Accounts
  bot.action('bulkgen', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('🧬 Enter how many Nike accounts to generate:\n\nFormat: `/bulkgen 10`', {
      parse_mode: 'Markdown'
    });
  });

  // === Callback: 📦 Upload Proxies
  bot.action('sendproxies', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply(
      '📩 Send your residential proxies in this format:\n\n`ip:port:user:pass`',
      { parse_mode: 'Markdown' }
    );
  });

  // === Callback: 🔁 Rotate Proxies
  bot.action('rotateproxy', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('🔄 Proxy rotation is automatic per session.');
  });

  // === Callback: 🔍 Monitor SKU
  bot.action('monitor_drops', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('📡 Use /monitor to fetch upcoming SNKRS drops.');
  });

  // === Callback: 🛒 JD Auto Checkout
  bot.action('jdcheckout', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('🛒 Send the SKU for JD Sports checkout:\n`/jdcheckout SKU123456`', {
      parse_mode: 'Markdown'
    });
  });

  // === Callback: 👟 Nike Auto Checkout
  bot.action('nikecheckout', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('👟 Send the SKU for SNKRS checkout:\n`/nikecheckout SKU123456`', {
      parse_mode: 'Markdown'
    });
  });

  // === Callback: 📂 View My Accounts
  bot.action('myaccounts', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('📂 Use `/myaccounts` to view your generated accounts.', {
      parse_mode: 'Markdown'
    });
  });

  // === Callback: 🌍 View Proxies
  bot.action('viewproxies', async (ctx) => {
    ctx.answerCbQuery();
    const userId = ctx.from.id;

    let proxy = userProxyMap.get(userId);
    if (!proxy) proxy = await assignProxy(userId);

    if (!proxy) {
      return ctx.reply('❌ Failed to assign proxy. Try again.');
    }

    ctx.reply(`🌍 Your assigned GeoNode proxy:\n\`\`\`\n${proxy}\n\`\`\``, {
      parse_mode: 'Markdown'
    });
  });

  // === Callback: 📊 Success Tracker
  bot.action('cooktracker', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('📊 Use `/cooktracker` to view your success stats.');
  });

  // === Callback: 💳 Add Cards
  bot.action('addcards', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply(
      '💳 Send your card using this format:\n\n`Name | Card | Exp | CVV | Address`',
      { parse_mode: 'Markdown' }
    );
  });

  // === Callback: 📁 Manage Profiles
  bot.action('profiles', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('📁 Use `/profiles` to manage your checkout profiles.');
  });

  // === Callback: 💡 FAQ / Help
  bot.action('faq', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply(
      `💡 For help or questions, DM [@badmandee1](https://t.me/badmandee1)`,
      { parse_mode: 'Markdown' }
    );
  });
};
