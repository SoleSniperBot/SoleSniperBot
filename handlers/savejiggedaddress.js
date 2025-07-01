const fs = require('fs');
const path = require('path');
const { Markup } = require('telegraf');

const jiggedPath = path.join(__dirname, '../data/jigged.json');

if (!fs.existsSync(jiggedPath)) {
  fs.writeFileSync(jiggedPath, JSON.stringify({}));
}

function saveJigged(data) {
  fs.writeFileSync(jiggedPath, JSON.stringify(data, null, 2));
}

module.exports = (bot) => {
  // List jigged addresses with inline buttons to delete
  bot.command('listjigged', async (ctx) => {
    const userId = ctx.from.id.toString();
    const allJigged = JSON.parse(fs.readFileSync(jiggedPath));
    const userJigged = allJigged[userId] || [];

    if (userJigged.length === 0) {
      return ctx.reply('📭 You have no saved jigged addresses.');
    }

    for (let i = 0; i < userJigged.length; i++) {
      const jig = userJigged[i];
      await ctx.reply(
        `#${i + 1}\n*${jig.label}*\n${jig.line1}\n${jig.cityPostcode}`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            Markup.button.callback('🗑 Delete', `delete_jig_${i}`)
          ])
        }
      );
    }
  });

  // Delete jigged address by index
  bot.action(/delete_jig_(\d+)/, async (ctx) => {
    const userId = ctx.from.id.toString();
    const index = parseInt(ctx.match[1], 10);

    const allJigged = JSON.parse(fs.readFileSync(jiggedPath));
    const userJigged = allJigged[userId] || [];

    if (index < 0 || index >= userJigged.length) {
      await ctx.answerCbQuery('❌ Invalid jigged address index.');
      return;
    }

    const removed = userJigged.splice(index, 1);
    allJigged[userId] = userJigged;
    saveJigged(allJigged);

    await ctx.editMessageText(
      `🗑 Deleted jigged address *${removed[0].label}* successfully.`,
      { parse_mode: 'Markdown' }
    );

    await ctx.answerCbQuery('✅ Deleted.');
  });
};
