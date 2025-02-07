# Production grade multistage docker file
FROM node:21-alpine3.18 as builder

WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./
COPY .npmrc ./
COPY src ./src
RUN npm install -g npm@latest
RUN npm ci && npm run build

# Next stage creates actual image that we need
FROM node:21-alpine3.18

WORKDIR /app
# Because in Kubernetes, I want to be able to test some endpoints from within
# our cluster. So from within our container.
# Note: The way I implemented services, only the health service can be accessed
# from the outside. Every other service can only be accessed from within the
# cluster. So we need `curl`
# Because we're using alpine version for image, we've access to apk
RUN apk add --no-cache curl
COPY package*.json ./
COPY tsconfig.json ./
COPY .npmrc ./
# Also install PM2 globally in the container: not just in the service itself.
RUN npm install -g pm2 npm@latest
# Run the production installation i.e `--production` flag won't install dev
# dependencies and hence, node_modules folder size will be reduced a bit
# The reason its not `npm install` and its `npm ci` is because I'm going to
# run this in CI/CD pipeline
RUN npm ci --production
# Now need to use build that was created in the above stage. So here we don't
# need to run `npm build`. here in /app/build, build is the name of the folder
# If its dist then we need to set up whatever our output folder is like
# /app/dist
COPY --from=builder /app/build ./build

EXPOSE 4003

CMD [ "npm", "run", "start" ]
