FROM node:24-alpine
WORKDIR /app
COPY package.json .
RUN npm install
RUN npm i -g serve
COPY .. .
RUN npm run build
CMD [ "serve", "-s", "dist" ]