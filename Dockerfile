FROM ubuntu:latest

RUN apt-get update -y && apt-get upgrade -y && apt-get install -y openssl

RUN mkdir /securekeys
RUN openssl req -newkey rsa:4096 -nodes -keyout /securekeys/private.key -out /securekeys/req.csr -subj "/CN=localhost"
RUN openssl x509 -req -days 3650 -in /securekeys/req.csr -signkey /securekeys/private.key -out /securekeys/cert.pem
