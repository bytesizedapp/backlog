import * as http from 'http'
import * as sockjs from 'sockjs'
import * as rethink from 'rethinkdb'
import * as dotenv from 'dotenv'

import { encode, decode } from './utilities/encoder'

dotenv.config()

const RETHINK_CONNECTION_DATA = {
  host: 'localhost',
  port: 28015,
}

class Socket {
  rethinkConnection: any = {}
  options: Object = {}
  socket: any = {}
  server: any = {}

  constructor(options) {
    const socket = sockjs.createServer(options)
    const server = http.createServer()

    const handleRethinkConnection = (error, rethinkConnection) => {
      if (error) throw error
      console.log('RethinkDB connection established.')

      const handleSocketMessage = (socketConnection) => (message) => {
        const data = decode(message)
        console.log('Got a message:', data)

        if (data.type === 'init') {
          const { uid, payload } = data
          const newTable = rethink.db(process.env.DB_NAME).tableCreate(uid)

          newTable.run(rethinkConnection, (error, response) => {
            if (error) throw error
            console.log('RethinkDB table created for ', uid)
          })
        }

        if (data.type === 'log') {
          const { uid, payload } = data
          const table = rethink.db(process.env.DB_NAME).table(uid)

          table.insert(data).run(rethinkConnection, (error, response) => {
            if (error) throw error
            console.log('RethinkDB log inserted for ', uid)
          })
        }
      }

      const handleSocketClose = (socketConnection) => (event) => {
        console.log('Connection closed: ', socketConnection.id)
      }

      socket.on('connection', (socketConnection) => {
        console.log('Connection established: ', socketConnection.id)
        socketConnection.on('data', handleSocketMessage(socketConnection))
        socketConnection.on('close', handleSocketClose(socketConnection))
      })

      socket.installHandlers(server, options.server)
      server.listen(process.env.SERVER_PORT)
    }

    rethink.connect(
      RETHINK_CONNECTION_DATA,
      handleRethinkConnection,
    )
  }
}

const socket = new Socket({
  sockjs_url: process.env.SOCKJS_CDN_URL,
  server: {
    prefix: '/backlog',
  },
})
