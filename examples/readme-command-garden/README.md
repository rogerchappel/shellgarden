# README Command Garden

This example models a README snippet that should stay executable:

```bash
printf 'version='; cat VERSION
```

Harvest or verify it from the repository root:

```bash
node dist/bin.js check examples/readme-command-garden --update
node dist/bin.js check examples/readme-command-garden
```
