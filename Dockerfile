FROM ubuntu:latest

RUN apt-get update -y && apt-get upgrade -y && apt-get install -y openssl

RUN mkdir /securekeys
RUN openssl req -newkey rsa:4096 -nodes -keyout /securekeys/private.key -out /securekeys/req.csr -subj "/CN=localhost"
RUN /bin/bash -c 'openssl x509 -req -days 825 -in /securekeys/req.csr -signkey /securekeys/private.key -out /securekeys/cert.pem -extfile <(printf "[v3_rhtnf]\nbasicConstraints = CA:FALSE\nkeyUsage = nonRepudiation, digitalSignature, keyEncipherment\nextendedKeyUsage = serverAuth\nsubjectAltName = DNS:localhost") -extensions v3_rhtnf'
