FROM node:alpine
WORKDIR "/app"
COPY ./package.json ./
RUN npm run clean
RUN npm install
COPY . .
CMD ["npm", "run", "start"]