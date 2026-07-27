FROM node:22-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY src ./src

# Persist WhatsApp session outside the container
VOLUME ["/app/auth_info"]

ENV AUTH_DIR=/app/auth_info
# Allow volume path (bot otherwise forces ~/.zizi-whatsapp-auth)
ENV ALLOW_PROJECT_AUTH_DIR=1
ENV NODE_ENV=production

CMD ["npm", "start"]
