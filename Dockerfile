FROM node:23.11.0-slim

WORKDIR /app

RUN npm install -g pnpm

COPY package.json ./
RUN pnpm install

COPY . .

EXPOSE 8000
CMD ["pnpm", "start"]