FROM cgr.dev/chainguard/node
ENV NODE_ENV=production
ENV PORT=8080

WORKDIR /app

COPY --chown=node:node ["package.json", "./"]
RUN npm install

COPY --chown=node:node ["server.js", "./"]
COPY --chown=node:node ["app", "./app"]

# Expose the default port
EXPOSE ${PORT}

CMD [ "server.js" ]
