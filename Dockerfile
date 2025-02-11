FROM node:20.1.0-alpine
RUN set -ex; \
    apk update; \
    apk add --no-cache \
    openssl
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 3005
CMD ["sh", "-c", "npx prisma db push && npx prisma db seed && npm run start"]
