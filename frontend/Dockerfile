# Stage 1: Build the React Application
FROM node:alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve the application with NGINX
FROM nginx:alpine
# Copy custom NGINX configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Copy built static files from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
