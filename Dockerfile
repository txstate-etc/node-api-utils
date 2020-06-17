FROM alpine:latest as keygen

RUN apk add openssl bash
SHELL ["/bin/bash","-c"]

RUN mkdir /securekeys &&\
	openssl genrsa 4096 >/securekeys/ca.key &&\
	openssl req -new -x509 -subj "/CN=TxState MWS Dev CA" -key /securekeys/ca.key -out /securekeys/ca.crt -sha256 -days 825 &&\
	openssl genrsa 4096 >/securekeys/private.key &&\
	openssl req -new -key /securekeys/private.key -subj "/CN=localhost" -out /securekeys/req.csr &&\
	openssl x509 -req -in /securekeys/req.csr -CA /securekeys/ca.crt -CAkey /securekeys/ca.key -set_serial 1 -sha256 -days 825 -out /securekeys/cert.pem -extfile <(printf "[v3_rhtnf]\nbasicConstraints = CA:FALSE\nkeyUsage = nonRepudiation, digitalSignature, keyEncipherment\nextendedKeyUsage = serverAuth\nsubjectAltName = DNS:localhost,DNS:couchdb") -extensions v3_rhtnf

FROM scratch

COPY --from=keygen /securekeys /securekeys
