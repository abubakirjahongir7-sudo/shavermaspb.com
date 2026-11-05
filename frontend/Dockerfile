FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# NEXT_PUBLIC_* qiymatlari build paytida JS'ga yopishtiriladi, runtime env yetarli emas.
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
RUN test -n "$NEXT_PUBLIC_API_BASE_URL"
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
