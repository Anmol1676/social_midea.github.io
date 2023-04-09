# Set the base image to the official Node.js image
FROM node:latest

EXPOSE 4000
WORKDIR /code
COPY *.json .
COPY server.js .
COPY . ./
RUN npm install
RUN npm add express 
RUN npm add body-parser
RUN npm add mysql
RUN npm add cors
RUN npm add socket.io 
RUN npm add socket.io-client
CMD [ "node", "server.js" ]
