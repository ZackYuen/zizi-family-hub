FROM node:22-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY src ./src

# Persist WhatsApp session outside the container
VOLUME ["/app/auth_info"]

ENV AUTH_DIR=/app/auth_info
ENV NODE_ENV=production

CMD ["npm", "start"]
