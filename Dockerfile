FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

RUN npm install -g nodemon

COPY src .

EXPOSE 3000

CMD ["npm", "run", "dev"]