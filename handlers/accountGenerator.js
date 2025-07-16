const fs = require('fs');
const path = require('path');
const { Markup } = require('telegraf');
const createNikeAccount = require('../lib/browserAccountCreator');
const loginNike = require('../lib/loginNike');
const { getLockedProxy, releaseLockedProxy } = require('../lib/proxyManager');

const vipPath = path.join(__dirname, '../data/vip.json');
const workingPath = path.join(__dirname, '../data/working_accounts.json');
if (!fs.existsSync(vipPath)) fs.writeFileSync(vipPath, JSON.stringify({}));
if (!fs.existsSync(workingPath)) fs.writeFileSync(workingPath, JSON.stringify({}));

module.exports = (bot) => {
  // Inline button entry point
  bot.command('accountgen', (ctx) => {
    const userId = String(ctx.from.id);
    const vipList = JSON.parse(fs.readFileSync(vipPath));
    if (!vipList[userId]) {
      return ctx.reply('❌ This feature is for VIP users only. Please upgrade to access it.');
    }

    ctx.reply('How many accounts would you like to generate?', Markup.inlineKeyboard([
      [Markup.button.callback('1 Account', 'gen_1')],
      [Markup.button.callback('3 Accounts', 'gen_3')],
      [Markup.button.callback('5 Accounts', 'gen_5')],
    ]));
  });

  // Action handler
  bot.action(/^gen_(\d+)/, async (ctx) => {
    const userId = String(ctx.from.id);
    const vipList = JSON.parse(fs.readFileSync(vipPath));
    if (!vipList[userId]) return ctx.answerCbQuery('❌ VIP access required.');

    const count = parseInt(ctx.match[1]);
    await ctx.answerCbQuery();
    await ctx.editMessageText(`🛠 Creating ${count} account(s)...`);

    const results = [];
    for (let i = 0; i < count; i++) {
      const proxy = await getLockedProxy(userId);
      if (!proxy) {
        results.push(`⚠️ [${i + 1}] No proxy available. Skipped.`);
        continue;
      }

      try {
        const acc = await createNikeAccount(proxy);
        if (!acc) {
          results.push(`❌ [${i + 1}] Account creation failed.`);
          continue;
        }

        const loggedIn = await loginNike(acc.email, acc.password, proxy);
        if (loggedIn) {
          results.push(`✅ [${i + 1}] ${acc.email} (Logged In)`);
          saveToWorking(userId, acc.email, '✅');
        } else {
          results.push(`⚠️ [${i + 1}] ${acc.email} (Login failed)`);
          saveToWorking(userId, acc.email, '❌');
        }
      } catch (err) {
        results.push(`❌ [${i + 1}] Error: ${err.message}`);
      } finally {
        await releaseLockedProxy(userId);
      }
    }

    await ctx.reply(results.join('\n'));
  });
};

function saveToWorking(userId, email, status) {
  const file = path.join(__dirname, '../data/working_accounts.json');
  const data = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file)) : {};
  if (!data[userId]) data[userId] = [];
  data[userId].push(`${email} ${status}`);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}
