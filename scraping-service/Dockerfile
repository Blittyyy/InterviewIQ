# Use an official Node.js runtime as a parent image
FROM node:18-slim

# Set the working directory in the container
WORKDIR /usr/src/app

# Install Google Chrome and other dependencies
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    # Add key and repo for Google Chrome
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    # Install Chrome
    && apt-get install -y google-chrome-stable \
    # Clean up
    && rm -rf /var/lib/apt/lists/*

# Copy package.json and package-lock.json
COPY package*.json ./

# Install app dependencies
RUN npm install

# Copy app source
COPY . .

# Your app binds to port 3005
EXPOSE 3005

# Define the command to run your app
CMD [ "node", "index.js" ] 