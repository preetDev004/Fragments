##################################################################################################
# Stage 0: Dependency Installation (Layer Caching Optimization)
##################################################################################################
# Use a pinned Node.js version with SHA256 hash for security and reproducibility
FROM node:22.5.1@sha256:86915971d2ce1548842315fcce7cda0da59319a4dab6b9fc0827e762ef04683a AS dependencies

# Set working directory to isolate application files
WORKDIR /app

# Copy dependency management files first to leverage Docker's layer caching. This ensures dependencies are only reinstalled when package files change.
COPY package.json package-lock.json tsconfig.json ./

# Install ALL dependencies (including devDependencies) using clean-install for reproducibility
RUN npm ci

##################################################################################################
# Stage 1: Application Build (Transient Build Environment)
##################################################################################################
# Reuse the same base image version to ensure build environment consistency
FROM node:22.5.1@sha256:86915971d2ce1548842315fcce7cda0da59319a4dab6b9fc0827e762ef04683a AS build

WORKDIR /app

# Copy installed dependencies from previous stage to avoid reinstallation
COPY --from=dependencies /app /app

# Copy application source code. This is done after dependency installation to optimize caching
COPY ./src ./src

# Copy test credentials (consider excluding from production in final stage)
COPY ./tests/.htpasswd ./tests/.htpasswd

# Compile TypeScript code to JavaScript. This requires devDependencies from previous stage
RUN npm run build

RUN npm prune --production && npm cache clean --force
##################################################################################################
# Stage 2 - Serve the build app (production)
##################################################################################################
FROM node:22.5.1-alpine3.20@sha256:9fcc1a6da2b9eee38638df75c5f826e06e9c79f6a0f97f16ed98fe0ebb0725c0 AS deploy

ARG COMMIT_SHA="development"
ARG BUILD_DATE="unknown"

LABEL version="${COMMIT_SHA}" \
      build-date="${BUILD_DATE}" \
      maintainer="Preet Patel <pdpatel51@myseneca.ca>" \
      description="Fragments node.js microservice"

# # We default to use port 8080 in our service
ENV PORT=8080 \
    # Reduce npm spam when installing within Docker - https://docs.npmjs.com/cli/v8/using-npm/config#loglevel
    NPM_CONFIG_LOGLEVEL=warn \ 
    # Disable colour when run inside Docker - https://docs.npmjs.com/cli/v8/using-npm/config#color
    NPM_CONFIG_COLOR=false

# Install curl for health checks and Install Tini for proper signal handling of child processes
RUN apk add --no-cache curl=8.12.1-r0 tini=0.19.0-r3

WORKDIR /app

# Copy package files from dependencies stage
COPY --from=build --chown=node:node  /app/node_modules ./node_modules

# Copy built artifacts from build stage
COPY --from=build --chown=node:node /app/build ./build

# Copy credentials (consider excluding in production or using secrets)
COPY --from=build --chown=node:node /app/tests/.htpasswd ./tests/.htpasswd

# Drop privileges to non-root user
USER node:node 

# Check container health every 30s, allow 15s timeout, 8s initial delay
HEALTHCHECK --interval=30s --timeout=15s --start-period=8s --retries=3 \
    CMD curl --fail http://localhost:${PORT} || exit 1

# Expose application port (best practice documentation)
EXPOSE ${PORT}

# Use Tini as PID 1 for proper signal handling and zombie process reaping
ENTRYPOINT ["/sbin/tini", "--"]

# Run the application
CMD ["node", "./build/src/index.js"]
