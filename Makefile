start:
	docker-compose up -d 

db:
	docker exec aprex-node-container npm install bcrypt

	docker exec aprex-database-container apt-get -y update
	docker exec aprex-database-container apt-get -y install cron
	docker exec aprex-database-container apt-get -y install sudo
	docker exec aprex-database-container apt-get -y install nano

	docker exec aprex-database-container sudo -n cp /srv/cron/crontab /etc/cron.d/aprex
	docker exec aprex-database-container sudo crontab /etc/cron.d/aprex
	docker exec aprex-database-container sudo service cron restart
all: start db