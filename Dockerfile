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
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/saude/prontidao').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["npm", "start"]
