import 'dotenv/config'
import { app } from './app'
import { connectDB } from './db/connect'

const DATABASE_USERNAME = process.env.MONGO_INITDB_ROOT_USERNAME || ''
const DATABASE_PASSWORD = process.env.MONGO_INITDB_ROOT_PASSWORD || '';
const DATABASE_NAME = process.env.MONGO_DATABASE || '';
const DATABASE_HOST = process.env.DATABASE_HOST || '';
const DATABASE_PORT = process.env.DATABASE_PORT || '';
const SERVER_PORT = process.env.SERVER_PORT || '';

const URI = `mongodb://${DATABASE_USERNAME}:${DATABASE_PASSWORD}@${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}?authSource=admin`;

async function start() {
    await connectDB(URI)
    app.listen(SERVER_PORT, () => {
        console.log(`Server running on ${SERVER_PORT}`)
    })
}

start().then(r => console.log(`Server running on ${SERVER_PORT}`))