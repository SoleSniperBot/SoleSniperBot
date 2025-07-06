const { Markup } = require('telegraf');
const fs = require('fs');
const path = require('path');
const { getLockedProxy } = require('../lib/proxyManager');

const vipPath = path.join(__dirname, '../data/vip.json');

// === Tier Detection
function getTier(userId) {
  const data = fs.existsSync(vipPath)
    ? JSON.parse(fs.readFileSync(vipPath, 'utf8'))
    : { vip: [], elite: [] };

  if (data.elite.includes(String(userId))) return 'elite';
  if (data.vip.includes(String(userId))) return 'vip';
  return 'free';
}

// === Proxy Cache
const lockedProxies = new Map();
async function assignProxy(userId) {
  if (lockedProxies.has(userId)) return lockedProxies.get(userId);
  const proxy = await getLockedProxy(userId);
  if (proxy) lockedProxies.set(userId, proxy);
  return proxy;
}

// === Main Menu
const mainMenu = Markup.inlineKeyboard([
  [Markup.button.callback('👟 Generate Accounts', 'bulkgen')],
  [Markup.button.callback('📦 Upload Proxies', 'sendproxies')],
  [Markup.button.callback('🔁 Rotate Proxies', 'rotateproxy')],
  [Markup.button.callback('🔍 Monitor SKU', 'monitor_drops')],
  [Markup.button.callback('🛒 JD Auto Checkout', 'jdcheckout')],
  [Markup.button.callback('👟 Nike Auto Checkout', 'nikecheckout')],
  [Markup.button.callback('📂 View My Accounts', 'myaccounts')],
  [Markup.button.callback('🌍 View Proxies', 'viewproxies')],
  [Markup.button.callback('📊 Success Tracker', 'cooktracker')],
  [Markup.button.callback('💳 Add Cards', 'addcards')],
  [Markup.button.callback('📁 Manage Profiles', 'profiles')],
  [Markup.button.callback('💡 FAQ / Help', 'faq')]
]);

const upgradeButtons = Markup.inlineKeyboard([
  [
    Markup.button.url('💎 Upgrade to VIP (£250)', 'https://buy.stripe.com/eVq00iepa4NB39BbgncfK00'),
    Markup.button.url('👑 Go Elite (£400)', 'https://buy.stripe.com/3cIfZg6WI4NBbG7dovcfK01')
  ]
]);

module.exports = (bot) => {
  bot.command(['start', 'menu'], async (ctx) => {
    const tier = getTier(ctx.from.id);
    const emoji = tier === 'elite' ? '👑' : tier === 'vip' ? '💎' : '🆓';
    const name = ctx.from.first_name || 'sniper';

    await ctx.reply(
      `👋 Welcome, ${name}!\n\nYour Tier: *${tier.toUpperCase()}* ${emoji}\nUse the buttons below to interact with SoleSniperBot.`,
      { ...mainMenu, parse_mode: 'Markdown' }
    );
  });

  bot.action(/.+/, async (ctx) => {
    ctx.answerCbQuery();
    const action = ctx.match[0];
    const userId = String(ctx.from.id);
    const tier = getTier(userId);

    const gated = {
      bulkgen: 'vip',
      sendproxies: 'vip',
      jdcheckout: 'vip',
      nikecheckout: 'vip',
      monitor_drops: 'vip',
      myaccounts: 'vip',
      viewproxies: 'vip',
      cooktracker: 'vip',
      addcards: 'vip',
      profiles: 'elite'
    };

    if (gated[action] && tier === 'free') {
      return ctx.reply(
        '⛔ This feature requires *VIP* or *Elite* access.',
        { parse_mode: 'Markdown', ...upgradeButtons }
      );
    }

    if (gated[action] === 'elite' && tier !== 'elite') {
      return ctx.reply(
        '🚫 This feature is for *Elite Snipers* only.',
        { parse_mode: 'Markdown', ...upgradeButtons }
      );
    }

    switch (action) {
      case 'bulkgen':
        return ctx.reply('🧬 Enter how many Nike accounts to generate:\n\nFormat: `/bulkgen 10`', { parse_mode: 'Markdown' });

      case 'sendproxies':
        return ctx.reply('📩 Send proxies:\n`ip:port:user:pass`\nPaste them as plain message.', { parse_mode: 'Markdown' });

      case 'rotateproxy':
        return ctx.reply('🔁 Proxy rotation is automatic.');

      case 'monitor_drops':
        return ctx.reply('📡 Use /monitor to find upcoming SNKRS drops.');

      case 'jdcheckout':
        return ctx.reply('🛒 JD Checkout:\nFormat: `/jdcheckout SKU123456`', { parse_mode: 'Markdown' });

      case 'nikecheckout':
        return ctx.reply('👟 Nike Checkout:\nFormat: `/nikecheckout SKU123456`', { parse_mode: 'Markdown' });

      case 'myaccounts':
        return ctx.telegram.emit('text', { text: '/myaccounts', from: ctx.from, chat: ctx.chat });

      case 'viewproxies': {
        const proxy = await assignProxy(userId);
        if (!proxy) return ctx.reply('❌ Could not assign a proxy. Try again.');
        return ctx.reply(`🌍 Your proxy:\n\`\`\`\n${proxy.ip}:${proxy.port}:${proxy.username}:${proxy.password}\n\`\`\``, {
          parse_mode: 'Markdown'
        });
      }

      case 'cooktracker':
        return ctx.reply('📊 Use `/cooktracker` to view success stats.', { parse_mode: 'Markdown' });

      case 'addcards':
        return ctx.reply('💳 Use `/cards`\nFormat: `Name | Card | Exp | CVV | Address`', { parse_mode: 'Markdown' });

      case 'profiles': {
        await ctx.reply('📁 Select your region for shoe sizing:', Markup.inlineKeyboard([
          [Markup.button.callback('🇬🇧 UK Sizing', 'set_region_uk')],
          [Markup.button.callback('🇺🇸 US Sizing', 'set_region_us')],
        ]));

        await ctx.reply('⚧ Choose your gender:', Markup.inlineKeyboard([
          [Markup.button.callback('♂️ Male', 'set_gender_male')],
          [Markup.button.callback('♀️ Female', 'set_gender_female')],
        ]));
        return;
      }

      case 'faq':
        return ctx.reply('💡 For help, message [@badmandee1](https://t.me/badmandee1)', { parse_mode: 'Markdown' });

      default:
        return ctx.reply('❓ Unknown action. Use /menu to restart.');
    }
  });
};
