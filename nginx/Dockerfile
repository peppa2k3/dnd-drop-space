# Build stage
FROM node:20-bullseye-slim AS build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
# Points the dev-only proxy target unused in production; VITE_API_PROXY_TARGET
# only affects `vite dev`, not the production build, so no build-arg needed here.
RUN npm run build

# Serve stage
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
