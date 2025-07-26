# Use Node 20 with necessary Chromium dependencies
FROM node:20-slim

# Install required dependencies for Puppeteer and tls-client
RUN apt-get update && apt-get install -y \
    wget \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgbm1 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# Create and set working directory
WORKDIR /app

# Download tls-client binary from GitHub Releases
RUN wget -O tls-client.exe https://github.com/SoleSniperBot/SoleSniperBot/releases/download/v1-tls/tls-client-api-windows-64-1.11.0.exe && \
    chmod +x tls-client.exe

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy all bot source code
COPY . .

# Puppeteer install hook
RUN npx puppeteer install

# Expose port for Express server
EXPOSE 8080

# Start the bot
CMD ["node", "index.js"]
