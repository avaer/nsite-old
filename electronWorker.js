const events = require('events');
const {EventEmitter} = events;
const {app, session, BrowserWindow} = require('electron');

const [u, t] = process.argv.slice(3);

console.warn('rendering', {u, t}, process.argv);

(async () => {
  await new Promise((accept, reject) => {
    app.once('ready', () => {
      accept();
    });
  });

  session.defaultSession.webRequest.onBeforeRequest((o, cb) => {
    console.warn('before req', o);

    cb();
  });
  session.defaultSession.webRequest.onErrorOccurred(o => {
    console.warn('req error', o);
  });
  session.defaultSession.webRequest.onCompleted(o => {
    console.warn('req completed', o);
  });

  const browserWindow = new BrowserWindow({
    webPreferences: {
      offscreen: true,
    },
  });
  const urls = [];
  browserWindow.webContents.session.webRequest.onBeforeRequest((o, cb) => {
    console.warn('inner before req', o);

    cb();
  });
  browserWindow.webContents.session.webRequest.onErrorOccurred(o => {
    console.warn('inner req error', o);
  });
  browserWindow.webContents.session.webRequest.onCompleted(o => {
    console.warn('inner req completed', o);

    const {details} = o;
    const {url} = details;
    console.warn('completed', url);
    urls.push(url);
  });

  console.warn('loading', u);

  [
    'did-start-loading',
    'did-stop-loading',
    'did-fail-load',
    'did-navigate',
    'dom-ready'
  ].forEach(e => {
    browserWindow.webContents.on(e, () => {
      console.warn('got event', e);
    });
  });

  console.warn('load url');
  browserWindow.webContents.loadURL(u);

  /* await new Promise((accept, reject) => {
    const domReady = () => {
      console.warn('dom ready');

      accept();
      cleanup();
    };
    browserWindow.webContents.on('dom-ready', domReady);
    const didFailLoad = err => {
      console.warn('dom fail load', err);

      reject(err);
      cleanup();
    };
    browserWindow.webContents.on('did-fail-load', didFailLoad);

    const cleanup = () => {
      browserWindow.webContents.removeListener('dom-ready', domReady);
      browserWindow.webContents.removeListener('did-fail-load', didFailLoad);
    };
  }); */
  process.stdout.write(JSON.stringify(urls));
  // console.warn('wait to exit');
  setTimeout(() => {
    console.warn('exit');
    process.exit();
  }, 2000);
})();

// process.exit();
