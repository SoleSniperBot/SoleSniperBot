// handlers/faq.js
module.exports = (bot) => {
  bot.command('faq', (ctx) => {
    const message = `
📚 *SoleSniperBot FAQ*

❓ *What is SoleSniperBot?*
A premium sneaker bot for auto-checkouts (ACO) on Nike SNKRS, JD, Footlocker, Offspring & more.

💳 *How do I become VIP or Elite?*
Pay via Stripe:
- £250/year = VIP (Full bot access)
- £400/year = Elite (Includes advanced features)

🔐 *How do I input Nike accounts + proxies?*
Use /bulkupload and submit your .csv or .txt file in this format:
\`email:password:proxyIP:proxyPort\`

🛡 *Why use SOCKS5 proxies?*
To avoid detection and improve checkout success. Use 1 proxy per Nike account.

🌐 *Where do I buy proxies or Nike accounts?*
- UK/US Proxies: https://oxylabs.io or https://rayobyte.com
- Nike Accounts: https://getnikeaccounts.com or https://buyaccounts.io

📬 *How do I set up IMAP autofetch for 2FA?*
Use your email + app password. Add it inside the bot using /imap. Optional SOCKS5 support available.

📦 *How do I save my card & address?*
Use /profiles to store multiple payment & shipping profiles.

📸 *What is “Cook Tracker”?*
Track your successful checkouts with /cooktracker. The more you cook, the higher your status.

🏆 *What are the user ranks?*
- 1: “Got em”
- 2: “Double Bubble 🫧”
- 3: “3’s a crowd 👟👟👟🔥”
- 4: “Getting sturdy 🕺🏾”
- 5: “I put 5 on it 🎵”
- 6: “Snipe-Demon 😈”
- 7: “Real OG Sniper 😎”
- 8: “Hall of Fame 🔥”
- 9: “Legend”
- 10+: “GOAT 🐐”
    `;
    ctx.replyWithMarkdown(message);
  });
};
