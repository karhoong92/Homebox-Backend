FROM node:14-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --production

COPY . .

CMD ["npm", "run", "production"]
