FROM node:20-alpine AS frontend-build
WORKDIR /frontend
RUN npm install -g pnpm
COPY frontend/package.json frontend/pnpm-lock.yaml ./
RUN pnpm install
COPY frontend/ ./
RUN pnpm build

FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache python3 make g++
RUN npm install -g pnpm
COPY backend/package.json ./
RUN pnpm install
COPY backend/src/ ./src/
COPY --from=frontend-build /frontend/dist ./public
EXPOSE 3000
CMD ["node", "src/index.js"]
