// basic
const http = require('http')
const conf = require('./config/defaultConfig')
const route = require('./helper/route')

// utils
const chalk = require('chalk')
const openUrl = require('./helper/openUrl')

class Server {
  constructor (config) {
    this.conf = {...conf, ...config}
  }
  start () {
    const server = http.createServer((req, res) => {
      route(req, res, this.conf)
    })
    server.listen(this.conf.port, this.conf.hostname, () => {
      const addr = `http://${this.conf.hostname}:${this.conf.port}`
      console.info(`Server started at ${chalk.green(addr)}`)
      openUrl(addr)
    })
  }
}

module.exports = Server