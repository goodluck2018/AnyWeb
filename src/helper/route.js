// basic
const path = require('path')
const fs = require('fs')
const mime = require('./mime')

// promosify
const promisify = require('util').promisify
const stat = promisify(fs.stat)
const readdir = promisify(fs.readdir)

// file compress
const compress = require('./compress')

// handlebars
const handlebars = require('handlebars')
const tplPath = path.join(__dirname, '../template/dir.tpl')
const source = fs.readFileSync(tplPath)
const template = handlebars.compile(source.toString())

// range
const range = require('./range')

// cache
const isFresh = require('./cache')

module.exports = async (req, res, conf) => {
  const filePath = path.join(conf.root, req.url)
  try {
    const stats = await stat(filePath)
    if (stats.isFile()) {
      if (isFresh(stats, req, res)) {
        res.statusCode = 304
        res.end()
        return
      }
      res.setHeader('Content-Type', mime(filePath))
      let rs
      const { code, start, end } = range(stats.size, req, res)
      if (code === 200) {
        res.statusCode = 200
        rs = fs.createReadStream(filePath)
      } else {
        res.statusCode = 206
        rs = fs.createReadStream(filePath, { start, end })
      }
      if (filePath.match(conf.compress)) rs = compress(rs, req, res)
      rs.pipe(res)
    } else if (stats.isDirectory()) {
      const files = await readdir(filePath)
      const dir = path.relative(conf.root, filePath)
      const data = {
        title: path.basename(filePath),
        dir: dir ? `/${dir}` : '',
        files
      }
      res.statusCode = 200
      res.setHeader('Content-Type', 'text/html')
      res.end(template(data))
    }
  } catch (err) {
    res.statusCode = 404
    res.setHeader('Content-Type', 'text/plain')
    res.end(`${filePath} is not a directory or file/n${err}`)
  }
}