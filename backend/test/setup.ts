import dotenv from 'dotenv'
import path from 'path'

// Load test-specific environment if present
dotenv.config({ path: path.resolve(__dirname, '.env.test') })

// Ensure test env
process.env.NODE_ENV = 'test'