# better-sqlite3 is a native module, so the stages that run `yarn install` need
# the toolchain to fall back to a source build when no prebuild matches
FROM node:22-bookworm-slim AS deps
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json yarn.lock .npmrc ./

FROM deps AS build
RUN yarn install --frozen-lockfile
COPY tsconfig.json ./
COPY src ./src
RUN yarn build

FROM deps AS prod-deps
RUN yarn install --frozen-lockfile --production

FROM node:22-bookworm-slim AS runtime
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=build /app/dist /app/dist
COPY package.json /app/package.json

# config.json and subscribers.db are both resolved relative to the working
# directory, so /data holds the whole mutable state of the bot
RUN mkdir -p /data && chown node:node /data
WORKDIR /data
USER node

CMD ["node", "/app/dist/main.js"]
