# Use Node 20 with Chromium dependencies
FROM node:20-slim

# Install dependencies for Puppeteer and TLS client
RUN apt-get update && apt-get install -y \
  wget \
  curl \
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

# Add TLS client binary and make it executable
RUN mkdir -p bin && \
  wget -q -O bin/tls-client https://github.com/SoleSniperBot/SoleSniperBot/releases/download/v1.0.0-linux/tls-client-api-linux-amd64-1.11.0 && \
  chmod +x bin/tls-client && \
  ls -l bin/tls-client

# Copy and install Node dependencies
COPY package*.json ./
RUN npm install

# Copy all source files
COPY . .

# Install Chromium for Puppeteer after source files for better cache
RUN npx puppeteer install

# Expose Express port
EXPOSE 8080

# Start the app
CMD ["node", "index.js"]
