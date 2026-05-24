FROM node:24-alpine

WORKDIR /app

# Copy các file cấu hình và cài đặt
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build Vite/React
RUN npm run build

# Cài đặt server nhẹ để serve file tĩnh build ra
RUN npm install -g serve

EXPOSE 5173

# Chạy server ở thư mục dist do Vite tạo ra
CMD ["serve", "-s", "dist", "-l", "5173"]