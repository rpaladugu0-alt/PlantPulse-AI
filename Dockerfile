FROM node:22-alpine AS build

WORKDIR /app
COPY package.json package-lock.json ./
COPY frontend/package.json frontend/package.json
COPY backend/package.json backend/package.json
RUN npm ci

COPY --chown=node:node . .
RUN npm run build

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080
USER node

CMD ["npm", "start"]
