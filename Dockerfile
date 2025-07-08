# Use Node 20 for compatibility + performance
FROM node:20

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json first
COPY package*.json ./

# Install only production dependencies
RUN npm install --production

# Copy rest of the project files
COPY . .

# Expose default port (optional if using a web server)
EXPOSE 3000

# Start your Telegram bot
CMD ["node", "index.js"]
