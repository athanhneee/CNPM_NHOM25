FROM node:24-alpine

WORKDIR /app

# Cài đặt thư viện OpenSSL cần thiết cho Prisma chạy trên Alpine Linux
RUN apk add --no-cache openssl

# Copy các file cấu hình và cài đặt dependencies
COPY package*.json ./
RUN npm install

# Copy toàn bộ source code
COPY . .

# Generate Prisma Client & Build code NestJS
RUN npx prisma generate
RUN npm run build

EXPOSE 3000

# Chạy bản production (đã compile ra thư mục dist)
CMD ["npm", "run", "start"]