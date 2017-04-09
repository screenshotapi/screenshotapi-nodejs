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

Or if rather than download the screenshot to a local file you prefer to retrieve the URL where your screenshot capture is hosted, use the below function.  Note that the S3 URL will only last for 72 hours, after which it will be automatically removed, so you will need to download it for permanent storage.

```javascript
  ScreenshotApi.getScreenshotReturningTemporaryUrl(
  API_KEY,        // your api key
  captureRequest, // the site to capture and your settings
  './'            // local path to store the screenshot png
  )
  .then( (url) => {
    console.log(`Screenshot can be downloaded from: ${url}`);
  })
  .catch( (err) => {
    console.error('Error capturing screenshot:', err);
  })
```

Debug output is disabled by default.  To enable debug output to see status while screenshot requests are progressing, use:

```javascript
ScreenshotApi.setDebugOutputMode(true);
```

# License

MIT
