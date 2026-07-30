FROM node:24-slim

WORKDIR /app

# Install OpenSSL for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY apps/api-nest/package.json apps/api-nest/package-lock.json* ./
COPY apps/api-nest/prisma ./prisma/
RUN npm install

# Generate Prisma client
RUN npx prisma generate

# Copy source
COPY apps/api-nest/ ./

# Build
RUN npm run build

# Expose port
EXPOSE 3000

# Start
CMD ["node", "dist/src/main"]
