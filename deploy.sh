npm install
#install prisma CLI
npm add -D prisma
#update db schema
npx prisma db push

#db migrate
npx prisma db execute --file ./backup/*-last.sql --schema ./prisma/schema.prisma

#Star 2 instance of service with the name "aprex-licence-man"
pm2-runtime start -i 2 -n aprex-licence-man ecosystem.config.js