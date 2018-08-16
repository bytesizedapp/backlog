import * as Socket from 'sockjs-client'
import * as nanoid from 'nanoid'
import * as generateUid from 'nanoid/generate'

import { encode, decode } from './utilities/encoder'

/**
 * Backlog main class.
 */

class Backlog {
  uid: string = generateUid('1234567890abcdef', 10)
  options: Object = {}
  socket: any = {}

  constructor(options) {
    const socket = new Socket(options.url)

    this.options = options
    this.socket = socket

    socket.onopen = this.initializeBacklog

    socket.onmessage = (event) => {
      console.log(decode(event.data))
    }

    socket.onclose = () => {
      console.log('Connection to backlog has been closed.')
    }
  }

  initializeBacklog = () => {
    this.dispatch('init')({ uid: this.uid })
  }

  dispatch = (type) => (payload) => {
    this.socket.send(encode({ type, uid: this.uid, payload }))
  }

  dispatchError = this.dispatch('error')
  dispatchInit = this.dispatch('init')
  dispatchLog = this.dispatch('log')
}

/**
 * Demo Backlog class usage.
 */

const backlog = new Backlog({
  url: 'http://localhost:9877/backlog',
  uid: 'nasty-pole-smoker',
})

setInterval(() => {
  backlog.dispatchLog({
    title: 'A new log, of course.',
    data: { name: nanoid(), age: 99, dangerous: true },
  })
}, 3000)
