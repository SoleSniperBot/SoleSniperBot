# Use Node.js 20 base image
FROM node:20

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the bot files
COPY . .

# Set env to avoid Chromium download (Puppeteer already handles it)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Expose port (for Express if used)
EXPOSE 3000

# Start the bot
CMD ["node", "index.js"]
