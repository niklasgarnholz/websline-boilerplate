const fs = require('fs');

function readFile(_path) {
  return new Promise((resolve, reject) => {
      fs.readFile(_path, 'utf8', (e, data) => {
          if(e) return reject(e);
          return resolve(data);
      });
  });
}

function writeFile(_path, data) {
  return new Promise((resolve, reject) => {
      fs.writeFile(_path, data, (e) => {
          if(e) return reject(e);
          return resolve();
      });
  });
}

module.exports = {
  readFile,
  writeFile,
}
