# Use the latest stable Node.js Alpine image
FROM node:20.1.0-alpine

RUN set -ex; \
    apk update; \
    apk add --no-cache \
    openssl

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first for caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Ensure Prisma Client is generated properly
RUN npx prisma generate

# Build the NestJS app
RUN npm run build

# Expose the application port
EXPOSE 3005

# Run Prisma migrations before starting the app
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
