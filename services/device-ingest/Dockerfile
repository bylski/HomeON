# syntax=docker/dockerfile:1
# a current Dockerfile frontend instead of the one built into the host's Docker: older engines
# (e.g. on CI runners) don't know `COPY --parents`
FROM node:24-slim
RUN corepack enable

# copy root files
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./

# copy all package jsons accordingly - not the most optimal way but works for now
COPY --parents **/package.json ./
# copy all needed source files
COPY generated ./generated
COPY libs ./libs
COPY services/device-ingest ./services/device-ingest

# install dependencies
RUN pnpm install --frozen-lockfile --ignore-scripts

RUN pnpm --filter @home-on/device-ingest build

USER node
CMD ["node", "services/device-ingest/dist/src/main.js"]