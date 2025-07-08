# Use Node.js base image
FROM node:20-slim

# Set working directory
WORKDIR /usr/src/app

# Install necessary dependencies for Puppeteer
RUN apt-get update && apt-get install -y --no-install-recommends \
  libnss3 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libcups2 \
  libxss1 \
  libgtk-3-0 \
  libgbm1 \
  libasound2 \
  libglu1-mesa \
  fonts-liberation \
  libappindicator3-1 \
  xdg-utils \
  ca-certificates \
  curl \
  wget \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your code
COPY . .

# Set environment variable to skip Chromium download
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Expose the port
EXPOSE 9000

# Start the app
CMD ["npm", "start"]
