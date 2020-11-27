const fs = window.require('fs').promises
// const path = window.require('path')

const fileHelper = {
  readFile: (path) => {
    return fs.readFile(path, { encoding: 'utf-8' })
  },
  writeFile: (path, content) => {
    return fs.writeFile(path, content, { encoding: 'utf-8' })
  },
  renameFile: (path, newPath) => {
    return fs.rename(path, newPath)
  },
  deleteFile: (path) => {
    return fs.unlink(path)
  }
}

// const testPath = path.join(__dirname, 'helper.js')
// fileHelper.readFile(testPath).then((data) => {
//   console.log(data)
// })

// const testWritePath = path.join(__dirname, 'helper.md')
// fileHelper.writeFile(testWritePath, '## hello world').then(() => {
//   console.log('写入成功')
// })

export default fileHelper