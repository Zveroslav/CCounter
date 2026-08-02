import jwt from 'jsonwebtoken';
import Database from 'better-sqlite3';
import crypto from 'crypto';

const db = new Database('./dev.db');
const id = crypto.randomUUID();
const email = 'test' + Date.now() + '@example.com';
db.prepare('INSERT INTO User (id, email, createdAt, updatedAt) VALUES (?, ?, ?, ?)').run(
  id, email, new Date().toISOString(), new Date().toISOString()
);

const token = jwt.sign({ id, email }, 'test-secret');
console.log(token);
