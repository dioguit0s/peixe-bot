const fs = require('node:fs');
const path = require('node:path');
const db = require('./connection');

const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

db.exec(schema);

console.log(`Banco de dados inicializado em ${db.name}`);
