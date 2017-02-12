ScreenshotApi-Js is a simple, promise based Node.js library for making
screenshot requests with www.screenshotapi.io.

# Installation
```
npm install screenshotapi --save
```

# Usage

```javascript
// get a free API key at www.screenshotapi.io
const API_KEY = 'your api key goes here';

var ScreenshotApi = require('screenshotapi');

var captureRequest = {
  url: 'http://www.amazon.com',
  webdriver: 'firefox',
  viewport: '1280x1024',
  fullpage: false,
  javascript: true
};

ScreenshotApi.getScreenshot(
  API_KEY,        // your api key
  captureRequest, // the site to capture and your settings
  './'            // local path to store the screenshot png
  )
  .then( (localFile) => {
    console.log(`Downloaded to ${localFile}`);
  })
  .catch( (err) => {
    console.error('Error capturing screenshot:', err);
  })
```

# License

MIT
