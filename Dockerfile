FROM node:12-alpine as builder

ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /usr/local/app
ADD . .

RUN apk add git python make g++
RUN npm install --prod

EXPOSE 3000

CMD ["node", "app.js"]
