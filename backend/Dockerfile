FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 4000
# CMD ["node", "dist/server.js"]
CMD ["npm", "run", "dev"]