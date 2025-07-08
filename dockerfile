# Use Node 20 image
FROM node:20

# Set working directory
WORKDIR /usr/src/app

# Copy package files and install
COPY package*.json ./
RUN npm install

# Copy everything else
COPY . .

# Expose port used by Railway
EXPOSE 9000

# Start bot
CMD ["npm", "start"]
