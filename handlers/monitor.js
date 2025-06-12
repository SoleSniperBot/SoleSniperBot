const { Markup } = require('telegraf');
const fs = require('fs');
const path = require('path');

const calendarPath = path.join(__dirname, '../data/calendar.json');
const discordPath = path.join(__dirname, '../data/discord.json');

if (!fs.existsSync(calendarPath)) {
  fs.writeFileSync(calendarPath, JSON.stringify([]));
}
if (!fs.existsSync(discordPath)) {
  fs.writeFileSync(discordPath, JSON.stringify({}));
}

let monitoredSKUs = [];

module.exports = (bot) => {
  bot.command('monitor', (ctx) => {
    ctx.reply(
      '👟 Enter the SKU(s) you want to monitor (separate multiple SKUs by commas):',
      Markup.inlineKeyboard([
        [Markup.button.callback('📅 View Calendar', 'view_calendar')],
        [Markup.button.callback('🔔 Add Alert', 'add_alert')],
        [Markup.button.callback('💥 Set Discord Webhook', 'set_discord')]
      ])
    );
  });

  bot.action('view_calendar', (ctx) => {
    ctx.answerCbQuery();
    const calendar = JSON.parse(fs.readFileSync(calendarPath));
    if (calendar.length === 0) {
      return ctx.reply('📅 No upcoming drops in the calendar.');
    }

    const formatted = calendar.map(item => `• ${item.date}: *${item.shoe}* (SKU: \`${item.sku}\`)`).join('\n');
    ctx.reply(`📅 Upcoming Drops:\n\n${formatted}`, { parse_mode: 'Markdown' });
  });

  bot.action('add_alert', (ctx) => {
    ctx.reply('🔫 Send the SKU(s) you want to add alerts for (comma separated).');
    ctx.session = { ...ctx.session, awaitingAlertInput: true };
  });

  bot.action('set_discord', (ctx) => {
    ctx.reply('🔗 Send your Discord webhook URL:');
    ctx.session = { ...ctx.session, awaitingWebhookInput: true };
  });

  bot.on('text', async (ctx) => {
    const userId = String(ctx.from.id);
    const input = ctx.message.text.trim();

    if (ctx.session?.awaitingAlertInput) {
      const skus = input.split(',').map(s => s.trim().toUpperCase());
      monitoredSKUs.push(...skus);
      ctx.session.awaitingAlertInput = false;
      return ctx.reply(`✅ Alerts set for:\n${skus.map(s => `• ${s}`).join('\n')}`);
    }

    if (ctx.session?.awaitingWebhookInput) {
      const discord = JSON.parse(fs.readFileSync(discordPath));
      discord[userId] = input;
      fs.writeFileSync(discordPath, JSON.stringify(discord, null, 2));
      ctx.session.awaitingWebhookInput = false;
      return ctx.reply('✅ Webhook saved! You’ll now get Discord alerts.');
    }
  });

  // Mock SKU ping logic (replace this with real SKU monitoring logic)
  setInterval(() => {
    if (monitoredSKUs.length === 0) return;
    const randomSku = monitoredSKUs[Math.floor(Math.random() * monitoredSKUs.length)];
    const dropMsg = `🚨 *Early Ping Detected!*\n\nSKU: \`${randomSku}\`\nProduct is loading on SNKRS.`;

    bot.telegram.sendMessage(process.env.OWNER_ID, dropMsg, { parse_mode: 'Markdown' });

    const discord = JSON.parse(fs.readFileSync(discordPath));
    for (const [userId, webhook] of Object.entries(discord)) {
      fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: dropMsg })
      });
    }
  }, 30000); // Ping every 30 seconds
};
