# Use Node.js 20 with minimal base
FROM node:20-slim

# Install essential packages for Puppeteer and TLS spoofing
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

# Set working directory
WORKDIR /app

# Download Linux TLS-client binary (spoofing engine)
RUN wget -O tls-client https://github.com/SoleSniperBot/SoleSniperBot/releases/download/v1.0.0-linux/tls-client-api-linux-amd64-1.11.0 && \
    chmod +x tls-client

# Copy package definition and install dependencies
COPY package*.json ./
RUN npm install

# Copy all source code (bot, TLS integration, logic)
COPY . .

# Install Puppeteer Chromium runtime
RUN npx puppeteer install

# Open port for Express bot server
EXPOSE 8080

# Launch entry point
CMD ["node", "index.js"]
