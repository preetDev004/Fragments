FROM node:23.5.0

LABEL maintainer="Preet Patel <pdpatel51@myseneca.ca>" \
      description="Fragments node.js microservice"

# We default to use port 8080 in our service
ENV PORT=8080 \
    # Reduce npm spam when installing within Docker - https://docs.npmjs.com/cli/v8/using-npm/config#loglevel
    NPM_CONFIG_LOGLEVEL=warn \ 
    # Disable colour when run inside Docker - https://docs.npmjs.com/cli/v8/using-npm/config#color
    NPM_CONFIG_COLOR=false

# Use /app as our working directory
WORKDIR /app

# Explicit filenames - Copy the package.json and package-lock.json
# files into the working dir (/app), using full paths and multiple source
# files.  All of the files will be copied into the working dir `./app`
COPY package.json package-lock.json tsconfig.json ./

# Install dependencies
RUN npm install

# Copy src to /app/src/
COPY ./src ./src

# Copy our HTPASSWD file
COPY ./tests/.htpasswd ./tests/.htpasswd

# Start the container by running our server in the shell environment
CMD npm start

# Expose port 8080
EXPOSE 8080
