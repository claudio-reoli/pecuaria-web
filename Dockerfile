# Estágio 1: Build
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
COPY frontend/package.json frontend/
COPY backend/package.json backend/
RUN npm install
COPY . .
RUN npm run build

# Estágio 2: Imagem final
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/backend/package.json /app/backend/
COPY --from=build /app/backend/node_modules /app/backend/node_modules
COPY --from=build /app/backend/dist /app/backend/dist
COPY --from=build /app/backend/prisma /app/backend/prisma
COPY --from=build /app/frontend/dist /app/frontend/dist
COPY --from=build /app/package.json /app/
COPY --from=build /app/scripts/docker-entrypoint.sh /app/scripts/
RUN chmod +x /app/scripts/docker-entrypoint.sh
RUN cd /app/backend && npx prisma generate
EXPOSE 3001
ENTRYPOINT ["/app/scripts/docker-entrypoint.sh"]
