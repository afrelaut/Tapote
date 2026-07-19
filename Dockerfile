FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html vite.config.js ./
COPY src ./src
COPY shared ./shared
COPY public ./public

# Vite remplace ces valeurs pendant le build. Elles sont toutes publiques :
# aucune clé Stripe, Supabase secrète ou autre secret serveur ne doit être ajoutée ici.
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_PILOT_DEMO=false
ARG VITE_REDIRECT_BASE_URL=https://t.tapote.fr
ARG VITE_LEGAL_COMPANY
ARG VITE_LEGAL_CAPITAL
ARG VITE_LEGAL_ADDRESS
ARG VITE_LEGAL_REGISTRATION
ARG VITE_LEGAL_VAT
ARG VITE_LEGAL_DIRECTOR
ARG VITE_LEGAL_CONTACT
ARG VITE_LEGAL_HOST
ARG VITE_LEGAL_PRIVACY_CONTACT
ARG VITE_LEGAL_RETURNS_ADDRESS
ARG VITE_LEGAL_VERSION

RUN npm run build && npm prune --omit=dev

FROM node:24-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN addgroup -S tapote && adduser -S tapote -G tapote
COPY --from=build --chown=tapote:tapote /app/node_modules ./node_modules
COPY --from=build --chown=tapote:tapote /app/dist ./dist
COPY --chown=tapote:tapote package.json ./package.json
COPY --chown=tapote:tapote server ./server
COPY --chown=tapote:tapote shared ./shared
# Supabase signe les connexions Postgres avec sa propre autorité racine.
# Node conserve ainsi rejectUnauthorized=true tout en validant cette chaîne.
COPY --chown=tapote:tapote deploy/certs/supabase-root-2021.crt ./certs/supabase-root-2021.crt
ENV NODE_EXTRA_CA_CERTS=/app/certs/supabase-root-2021.crt
USER tapote
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 CMD node -e "fetch('http://127.0.0.1:'+(process.env.API_PORT||process.env.PORT||3001)+'/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "--import", "./server/instrument.js", "server/index.js"]
