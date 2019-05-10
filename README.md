# LBLOD event broker

This service is used as a middleware that connects to the SPARQL database, executes queries on this database and send the generalized resource to the decision service.

To locally test this service, you'll need to mount this map in your docker compose file
This is already done in the `docker-compose.blockchain.dev.yml` file, just make sure the path is correct.

If you want to run this service locally, you'll have to install the dependencies for this specific platform: 8.12.0
```bash
npm install --target=8.12.0 --target_platform=linux --target_arch=x64 --target_libc=musl .
```
