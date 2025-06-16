const { fetchLotByModel, fetchSnkrsUpcoming } = require('../lib/dropFetchers');

bot.action('start_monitoring', async ctx => {
  await ctx.answerCbQuery();
  const modelName = ctx.state.modelName || 'Jordan 5'; // or extract from input
  try {
    const [apiDrops, snkrsDrops] = await Promise.all([
      fetchLotByModel(modelName),
      fetchSnkrsUpcoming()
    ]);
    const allDrops = [...apiDrops, ...snkrsDrops]
      .filter(d => d.name.toLowerCase().includes(modelName.toLowerCase()));

    if (!allDrops.length) {
      return ctx.reply(`No upcoming drops found for "${modelName}".`);
    }

    const msg = allDrops.map(d => 
      `👟 *${d.name}*\nSKU: \`${d.sku}\`\n📅 Release: *${new Date(d.releaseDate).toUTCString()}*`
    ).join('\n\n');

    ctx.reply(msg, { parse_mode: 'Markdown' });
    // Optionally store SKUs to your calendar.json, then start monitoring them...
  } catch (err) {
    console.error(err);
    ctx.reply('⚠️ Error fetching drops—try again later.');
  }
});
