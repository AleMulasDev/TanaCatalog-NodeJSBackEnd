# Tana Catalog - NodeJS API

Questa repository contine il back-end, realizzato con nodejs, del sito che permetterà all'associazione Tana dei Goblin di Cagliari di gestire il loro catalogo di giochi da tavolo, con la loro posizione, descrizione a altro.

# Premessa

I seguenti comandi partono dal presupposto che abbiate già installato NodeJS.
Sono di seguito riportate le versioni utilizzate:
NodeJS: 10.16.3
Npm: 6.9.0

### Utilizzo di Servizi esterni

Per le comunicazioni via mail agli utenti, questa api, utilizza Twilio SendGrid.
Se si vuole continuare il suo utilizzo visualizzare il file [mockApiKeys.js](/utils/mockApiKeys.js), altrimenti modificare per le proprie esigenze il file che astrae il funzionamento delle mail [mail.js](/utils/mail.js)

# Installazione

Per installare i pacchetti di cui c'è bisogno utilizzare il comando `npm install` che prevvederà al loro download.

### Mysql

Questa API utilizza MYSQL come base di dati. Tuttavia tutte le interfacce sono definite in [sql.js](/utils/sql.js) e possono essere modificate per le proprie esigenze.
Per l'utilizzo di MYSQL, il nome utente e la password dello stesso sono definiti all'interno del file "_secrets.js", per visualizzarne un esempio guarda [mockSecrets.js](/utils/mockSecrets.js)

### RSA Keys

Per la creazione e la verifica dei JWT sono necessarie due chiavi (privata/pubblica), contenute nella cartella _keys. Per far funzionare gli import originali, esse dovranno avere i seguenti nomi:
jwtRS256.key
jwtRS256.key.pub
Le chiavi originali sono state create in ambiente Linux (Ubuntu server 18.04) coi seguenti comandi:
```
ssh-keygen -t rsa -b 4096 -m PEM -f jwtRS256.key
#Senza pass phrase
openssl rsa -in jwtRS256.key -pubout -outform PEM -out jwtRS256.key.pub
```

# Avvio

Per l'avvio basterà utilizzare il comando `npm start`