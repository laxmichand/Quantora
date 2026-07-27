FROM node:22-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
COPY prisma ./prisma/
RUN npm install

# Generate Prisma client
RUN npx prisma generate

# Copy source
COPY . .

# Build
RUN npm run build

# Verify build output
RUN ls -la dist/src/

# Expose port
EXPOSE 3000

# Start
CMD ["node", "dist/src/main"]
