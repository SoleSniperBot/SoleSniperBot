module.exports = (bot) => {
  bot.start((ctx) => {
    const welcome = `
👋 *Welcome to SoleSniperBot!*

🔧 Use the buttons or type commands to get started:
- /proxies — Fetch working proxies
- /help — For usage and tier info

Let’s cook 👟🔥
    `;
    ctx.replyWithMarkdown(welcome);
  });
};
