FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S apiwalletgroup
RUN adduser -S apiwalletuser -u 1001 -G apiwalletgroup

# Create logs directory
RUN mkdir -p /app/logs && chown -R apiwalletuser:apiwalletgroup /app

# Switch to non-root user
USER apiwalletuser

# Expose port
EXPOSE 6789

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:6789/monitoring/health || exit 1

# Start the application
CMD ["npm", "start"]
