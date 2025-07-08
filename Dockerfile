# Use official Node image
FROM node:20

# Create app directory
WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy all files
COPY . .

# Expose the port (same as in your .env or index.js)
EXPOSE 9000

# Start the bot
CMD [ "npm", "start" ]
