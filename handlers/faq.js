module.exports = async function handleFAQ(ctx) {
  ctx.replyWithMarkdownV2(
    '*🧠 SoleSniper FAQ*\n\n' +
    '*1\\. Why use SOCKS5 proxies?*\n' +
    'Every Nike account should run through a unique IP\\. This reduces bans and increases checkout chances\\.\n\n' +
    '*2\\. Where can I get proxies?*\n' +
    '[UK Proxies](https://proxy-cheap.com)  \\|  [US Proxies](https://oxylabs.io)\n\n' +
    '*3\\. Where to buy Nike accounts?*\n' +
    '[Trusted UK Sellers](https://bulkaccounts.uk)  \\|  [US Sellers](https://getnikes.com)\n\n' +
    '*4\\. Can I use this bot on mobile?*\n' +
    'Yes, Telegram bots work seamlessly on iOS and Android\\.\n\n' +
    '*5\\. Where do I save card & address info?*\n' +
    'Use /addprofile to save your checkout info\\. Each user has a private encrypted profile\\.\n\n' +
    '_Need more help? DM us on Telegram_'
  );
};
