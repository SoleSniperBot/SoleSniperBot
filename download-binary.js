// download-binary.js
const https = require('https');
const fs = require('fs');
const path = require('path');

const url = 'https://github.com/SoleSniperBot/SoleSniperBot/releases/download/v1.0.0-linux/tls-client-api-linux-amd64-1.11.0';
const outputPath = path.join(__dirname, 'bin/tls-client-api');

const file = fs.createWriteStream(outputPath, { mode: 0o755 });

https.get(url, (response) => {
  if (response.statusCode !== 200) {
    console.error(`❌ Download failed: ${response.statusCode} ${response.statusMessage}`);
    return;
  }

  response.pipe(file);
  file.on('finish', () => {
    file.close();
    console.log('✅ tls-client-api binary downloaded to bin/tls-client-api');
  });
}).on('error', (err) => {
  fs.unlinkSync(outputPath);
  console.error(`❌ Error downloading binary: ${err.message}`);
});
