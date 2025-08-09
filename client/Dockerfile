# Multi-stage build for React app

# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built app from builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create non-root user
RUN addgroup -g 1001 -S nginx && \
    adduser -S smartrail -u 1001 -G nginx

# Change ownership
RUN chown -R smartrail:nginx /usr/share/nginx/html && \
    chown -R smartrail:nginx /var/cache/nginx && \
    chown -R smartrail:nginx /var/log/nginx && \
    chown -R smartrail:nginx /etc/nginx/conf.d

# Switch to non-root user
USER smartrail

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:80 || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
