# Use Node.js LTS image as the base image
FROM node:18-slim

# Set working directory
WORKDIR /app

# Set NODE_ENV to production
ENV NODE_ENV=production
# Allow port to be configurable via environment variable
ENV PORT=3000

# Copy package files first to leverage Docker cache
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy application files
COPY server.js ./
COPY app ./app

# Create a non-root user and switch to it
RUN useradd -r -u 1001 -g node nodeuser
USER nodeuser

# Expose the port
EXPOSE $PORT

# Start the application
CMD ["node", "server.js"]
