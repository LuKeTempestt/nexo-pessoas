FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY backend/package*.json backend/
COPY frontend/package*.json frontend/
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY package*.json ./
COPY backend/package*.json backend/
COPY frontend/package*.json frontend/
RUN npm ci --omit=dev && npm cache clean --force
COPY backend backend
COPY --from=build /app/frontend/dist frontend/dist
USER node
EXPOSE 3000
CMD ["npm", "start"]
