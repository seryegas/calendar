FROM node:24-alpine
WORKDIR /app
COPY package.json .
RUN npm install
RUN npm i -g serve
COPY .. .
COPY .env_prod .env
RUN npm run build
CMD [ "serve", "-s", "dist" ]