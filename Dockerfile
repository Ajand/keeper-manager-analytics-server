# Use an official Node.js runtime as the base image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy your package.json and yarn.lock (if present) to the container
COPY package.json yarn.lock* ./

# Install app dependencies using Yarn
RUN yarn install --production

# Copy your application code to the container
COPY index.js .

# Expose the port your app will run on (if applicable)
# EXPOSE 3000

# Start your Node.js app
CMD ["node", "index.js"]
