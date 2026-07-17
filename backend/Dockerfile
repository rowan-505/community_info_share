FROM node:22-slim AS base

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm ci

COPY prisma ./prisma

RUN npx prisma generate

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
