# ========================================
# Multi-stage Dockerfile for vamo-store (Next.js Static Export with Nginx)
# ========================================

# Stage 1: Dependencies
FROM node:18-alpine AS deps
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Stage 2: Builder
FROM node:18-alpine AS builder
WORKDIR /app

# Accept build arguments
ARG NEXT_PUBLIC_VM_SERVICE_URL
ARG NEXT_PUBLIC_VM_SERVICE_CLIENT_ID
ARG NEXT_PUBLIC_VM_SERVICE_CLIENT_SECRET
ARG NEXT_PUBLIC_RAZORPAY_KEY_ID

# Set as environment variables for the build
ENV NEXT_PUBLIC_VM_SERVICE_URL=$NEXT_PUBLIC_VM_SERVICE_URL
ENV NEXT_PUBLIC_VM_SERVICE_CLIENT_ID=$NEXT_PUBLIC_VM_SERVICE_CLIENT_ID
ENV NEXT_PUBLIC_VM_SERVICE_CLIENT_SECRET=$NEXT_PUBLIC_VM_SERVICE_CLIENT_SECRET
ENV NEXT_PUBLIC_RAZORPAY_KEY_ID=$NEXT_PUBLIC_RAZORPAY_KEY_ID
ENV NEXT_TELEMETRY_DISABLED=1

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the static export
RUN npm run build

# Stage 3: Production with Nginx
FROM nginx:alpine AS runner

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built static files
COPY --from=builder /app/out /usr/share/nginx/html

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
