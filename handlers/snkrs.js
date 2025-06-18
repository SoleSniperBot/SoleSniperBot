const { fetchSnkrsDropsDetailed } = require('../lib/snkrsApi');

module.exports = (bot) => {
  bot.command('snkrs', async (ctx) => {
    await ctx.reply('👟 Fetching SNKRS UK upcoming drops...');
    const drops = await fetchSnkrsDropsDetailed();
    if (drops.length === 0) return ctx.reply('⚠️ No upcoming drops found.');

    for (const drop of drops.slice(0, 5)) {
      await ctx.replyWithPhoto(drop.image, {
        caption: `🔥 *${drop.title}*\nSKU: \`${drop.sku}\`\nColor: ${drop.color}\nPrice: £${drop.retailPrice}\nLaunch: ${drop.launchDate.split('T')[0]}`,
        parse_mode: 'Markdown'
      });
    }
  });
};
