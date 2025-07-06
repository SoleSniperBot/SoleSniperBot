const fs = require('fs');
const path = require('path');
const { Markup } = require('telegraf');
const { getTier } = require('./auth');
const { getLockedProxy } = require('../lib/proxyManager');

const accountsPath = path.join(__dirname, '../data/accounts.json');
const statsPath = path.join(__dirname, '../data/stats.json');
const profilePath = path.join(__dirname, '../data/profiles.json');
const imapPath = path.join(__dirname, '../data/imap.json');

module.exports = (bot) => {
  bot.command('dashboard', async (ctx) => {
    const userId = String(ctx.from.id);
    const tier = getTier(userId);
    const emoji = tier === 'elite' ? '👑' : tier === 'vip' ? '💎' : '🆓';

    let accounts = [];
    if (fs.existsSync(accountsPath)) {
      const all = JSON.parse(fs.readFileSync(accountsPath));
      accounts = all.filter(acc => acc.userId === userId);
    }

    let stats = {};
    if (fs.existsSync(statsPath)) {
      const all = JSON.parse(fs.readFileSync(statsPath));
      stats = all[userId] || {};
    }

    let profile = {};
    if (fs.existsSync(profilePath)) {
      const all = JSON.parse(fs.readFileSync(profilePath));
      profile = all[userId] || {};
    }

    let imapStatus = '❌ Not Set';
    if (fs.existsSync(imapPath)) {
      const all = JSON.parse(fs.readFileSync(imapPath));
      if (all[userId]) imapStatus = '✅ Set';
    }

    const proxy = await getLockedProxy(userId);
    const proxyStr = proxy
      ? `\`\`\`\n${proxy.ip}:${proxy.port}:${proxy.username}:${proxy.password}\n\`\`\``
      : '❌ None Assigned';

    const msg = `📊 *SoleSniperBot Dashboard*\n\n` +
      `👤 *Tier:* ${tier.toUpperCase()} ${emoji}\n` +
      `🧬 *Accounts Generated:* ${accounts.length}\n` +
      `✅ *Successful Checkouts:* ${stats.checkouts || 0}\n` +
      `💳 *Card/Address Saved:* ${profile.card ? '✅' : '❌'} / ${profile.address ? '✅' : '❌'}\n` +
      `📬 *IMAP Status:* ${imapStatus}\n` +
      `🌍 *Current Proxy:* ${proxyStr}`;

    ctx.reply(msg, { parse_mode: 'Markdown' });
  });
};
