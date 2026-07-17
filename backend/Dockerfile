FROM node:22-slim AS base

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm ci

COPY prisma ./prisma

RUN npx prisma generate


COPY . .

ARG DATABASE_URL
ARG JWT_SECRET
ARG NODE_ENV
ARG DEMO_MODE

ENV DATABASE_URL=${DATABASE_URL}
ENV JWT_SECRET=${JWT_SECRET}
ENV NODE_ENV=${NODE_ENV}
ENV DEMO_MODE=${DEMO_MODE}

RUN npm run build
RUN npm run migrate

EXPOSE 3000

CMD ["npm", "start"]
