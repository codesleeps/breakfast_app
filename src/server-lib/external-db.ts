import axios from 'axios';

// Create an axios instance for external database queries
export const externalDbClient = axios.create({
  baseURL: process.env.EXTERNAL_DB_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});