const path = require('path');
const http = require('http');
const child_process = require('child_process');
const express = require('express');

const electronPath = path.join(require.resolve('electron'), '..', 'cli.js');
const electronWorkerPath = path.join(__dirname, 'electronWorker.js');
const PORT = process.env['PORT'] || 9000;

if (!process.env['DISPLAY']) {
  process.env['DISPLAY'] = ':0';
}

const app = express();

app.get('/package', (req, res, next) => {
  let {u = 'http://google.com/', t = 'windows'} = req.params;
  u = decodeURIComponent(u);

  const cp = child_process.spawn(electronPath, ['--disable-background-timer-throttling', electronWorkerPath, u, t]);
  const bs = [];
  cp.stderr.pipe(process.stderr);
  cp.stdout.on('data', d => {
    console.log('got data', JSON.stringify(d.toString()));
    bs.push(d);
  });
  cp.on('exit', code => {
    console.log('child process exit', code);
  });
  cp.on('close', code => {
    if (code === 0) {
      const b = Buffer.concat(bs);
      console.log('got all data', bs.length, b.length);
      res.end();
    } else {
      console.warn('bad electron exit status code', u, code);
      res.send(500);
    }
  });
});

http.createServer(app)
  .listen(PORT, () => {
    console.log(`http://127.0.0.1:${PORT}/`);
  });

process.on('uncaughtException', err => {
  console.warn(err);
});
