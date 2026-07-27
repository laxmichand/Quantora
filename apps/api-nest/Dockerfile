FROM node:22-alpine

WORKDIR /app

# Install dependencies
COPY apps/api-nest/package.json apps/api-nest/package-lock.json* ./
COPY apps/api-nest/prisma ./prisma/
RUN npm install

# Generate Prisma client
RUN npx prisma generate

# Copy source
COPY apps/api-nest/ .

# Build
RUN npm run build

# Verify build output
RUN ls -la dist/src/

# Expose port
EXPOSE 3000

# Start
CMD ["node", "dist/src/main"]
