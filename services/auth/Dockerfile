FROM node:22-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm i -g typescript

RUN npm run build

EXPOSE 5000

CMD ["node", "dist/index.js"]
