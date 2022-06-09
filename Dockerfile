FROM keymetrics/pm2:latest-alpine

# Bundle APP files
WORKDIR /srv
COPY . /srv
# Install app dependencies
ENV NPM_CONFIG_LOGLEVEL warn
RUN npm install
RUN npm install pm2@latest -g
RUN pm2 update
# Expose the listening port of your app
EXPOSE 8000

CMD [ "pm2-runtime", "start", "ecosystem.config.js" ]
