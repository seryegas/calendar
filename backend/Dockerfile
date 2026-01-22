FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY .. .
CMD ["ts-node", "index.ts"]