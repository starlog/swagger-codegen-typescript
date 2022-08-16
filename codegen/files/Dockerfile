FROM node:16

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY *.json ./

# Bundle app source
COPY . /usr/src/app

RUN npm install
RUN npm install --location=global typescript
RUN npm run build


EXPOSE 3000
CMD [ "node", "dist/index.js" ]
