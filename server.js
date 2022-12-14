const dotenv = require('dotenv')
const mongoose = require('mongoose')
const app = require('./app')

dotenv.config({ path: './config.env' })

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DB_PASSWORD
)
const port = process.env.PORT

process.on('uncaughtException', err => {
  console.log(err.name, err.message)
  console.log('UNCAUGHT EXCEPTION! ๐งจ Shutting down...')

  process.exit(1)
}
)

mongoose.connect(DB,
  {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
  }).then(() => console.log('DB connection successful!'))

const server = app.listen(port, () => console.log(`Listening on port ${port}...`))

process.on('unhandledRejection', err => {
  console.log(err.stack)
  console.log(err.name, err.message)
  console.log('UNHANDLED REJECTION! ๐งจ Shutting down...')
  server.close(() => {
    process.exit(1)
  })
})

process.on('SIGTERM', () => {
  console.log('๐ SIGTERM RECEIVED. Shutting down gracefully')
  server.close(() => {
    console.log('Process terminated! ๐ฅ')
  })
})
