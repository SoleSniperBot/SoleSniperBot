const fs = require('fs');
const path = require('path');
const { fetchLotByModel, fetchSnkrsUpcoming } = require('../lib/dropFetchers');

const calendarPath = path.join(__dirname, '../data/calendar.json');

module.exports = (bot) => {
  // Manual command version (e.g. /monitor Jordan 4)
  bot.command('monitor', async (ctx) => {
    const query = ctx.message.text.split(' ').slice(1).join(' ');
    if (!query) return ctx.reply('❗ Please provide a model name. Example:\n`/monitor Jordan 4 Black Cat`', { parse_mode: 'Markdown' });

    await ctx.reply(`🔍 Searching for upcoming drops matching: *${query}*...`, { parse_mode: 'Markdown' });

    try {
      const [lotResults, snkrsResults] = await Promise.all([
        fetchLotByModel(query),
        fetchSnkrsUpcoming()
      ]);

      const combined = [...lotResults, ...snkrsResults].filter(d =>
        d.name.toLowerCase().includes(query.toLowerCase())
      );

      if (combined.length === 0) {
        return ctx.reply('📭 No matching drops found.');
      }

      // Save to calendar.json
      const saved = fs.existsSync(calendarPath) ? JSON.parse(fs.readFileSync(calendarPath)) : [];
      combined.forEach(entry => {
        if (!saved.find(e => e.sku === entry.sku)) {
          saved.push(entry);
        }
      });
      fs.writeFileSync(calendarPath, JSON.stringify(saved, null, 2));

      // Reply with results
      const msg = combined.map(entry =>
        `👟 *${entry.name}*\nSKU: \`${entry.sku}\`\n📅 Release: *${entry.releaseDate}*`
      ).join('\n\n');

      ctx.reply(msg, { parse_mode: 'Markdown' });
    } catch (err) {
      console.error(err);
      ctx.reply('⚠️ Error while fetching drops.');
    }
  });

  // Callback button version
  bot.action('start_monitoring', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply('📝 Please type the model you want to monitor:\n\nExample: `Jordan 4 Bred`', { parse_mode: 'Markdown' });
  });
};
