const request = require('request');
const Path = require('path');
const sleep = require('sleep-async')();
const retryDelaySecs = 5;

module.exports = {
  getScreenshot,
  getScreenshotReturningTemporaryUrl,
  captureScreenshot,
  retrieveScreenshot,
  setDebugOutputMode
};

var showDebugOutput = false;

function setDebugOutputMode(showOutput) {
  showDebugOutput = showOutput;
}

function getScreenshot(apikey, captureRequest, saveToPath) {
  return new Promise( (resolve, reject) => {
    captureScreenshot(apikey, captureRequest)
      .then( (captureRequestKey) => {
        return retrieveScreenshot(apikey, captureRequestKey, saveToPath)
      })
      .then( (localFile) => resolve(localFile) )
      .catch( (err) => reject(err) );
  });
}

function getScreenshotReturningTemporaryUrl(apikey, captureRequest) {
  return new Promise( (resolve, reject) => {
    captureScreenshot(apikey, captureRequest)
      .then( (captureRequestKey) => {
        return retrieveScreenshotTemporaryUrl(apikey, captureRequestKey)
      })
      .then( (url) => resolve(url) )
      .catch( (err) => reject(err) );
  });  
}

function captureScreenshot(apikey, captureRequest) {
  return new Promise( (resolve, reject) => {
    var post_options = {
      uri: 'https://api.screenshotapi.io/capture',
      port: '443',
      method: 'POST',
      headers: { 'apikey': apikey },
      body: JSON.stringify(captureRequest)
    };

    if (showDebugOutput) {
      console.log(`Requesting capture for ${captureRequest.url}`);
    }
    request(post_options, (error, response, body) => {
      if (error) {
        reject(error);
      } else {
        if (response.statusCode === 401) {
          reject('Bad API key');
        } else if (response.statusCode >= 400) {
          reject(`Error requesting capture: ${body}`);
        } else {
          var json_results = JSON.parse(body);
          if (showDebugOutput) {
            console.log('Accepted request with key: ' + json_results.key);
          }
          resolve(json_results.key);
        }
      }
    });
  });
}

function retrieveScreenshotTemporaryUrl(apikey, key) {
  return new Promise( (resolve, reject) => {
    if (showDebugOutput) {
      console.log(`Trying to retrieve: ${key}`);
    }
    const retrieve_url = 'https://api.screenshotapi.io/retrieve?key=' + key;
    const options = { headers: { 'apikey': apikey } };

    request.get(retrieve_url,options, (error,response,body) => {
      if (error) {
        reject(error);
      } else {
        let json_results = JSON.parse(body);
        //console.log(json_results);
        if (json_results.status === 'ready') {
          resolve(json_results.imageUrl);
        } else if (json_results.status === 'error') {
          reject(new Error(json_results.msg));
        } else {
          if (showDebugOutput) {
            console.log(`Screenshot not yet ready.. waiting for ${retryDelaySecs} seconds.`);
          }
          sleep.sleep(
            retryDelaySecs * 1000, () => {
              retrieveScreenshotTemporaryUrl(apikey, key)
                .then( (url) => resolve(url) )
                .catch( (err) => reject(err) );
            });
        }
      }
    });
  });
}


function retrieveScreenshot(apikey, key, saveToPath) {
  return new Promise( (resolve, reject) => {
    retrieveScreenshotTemporaryUrl(apikey, key)
    .then( url => {
      let localFile = Path.join(saveToPath, `${key}.png`);
      return download(url, localFile);
    })
    .then( (localFile) => {
      if (showDebugOutput) {
        console.log(`Saved screenshot to ${localFile}`)
      }
      resolve(localFile);
    })
    .catch( (err) => {
      if (showDebugOutput) {
        console.error(err, 'Error saving screenshot');
      }
      reject(err);
    })
  });
}

function download(imageUrl, localFile) {
  return new Promise( (resolve, reject) => {
    try {
      if (showDebugOutput) {
        console.log(`Downloading ${imageUrl}`);
      }
      const fs = require('fs');
      let imageStream = request(imageUrl);
      let writeStream = fs.createWriteStream(localFile);
      imageStream.pipe(writeStream);
      writeStream.on('finish', () => {
        resolve(localFile);
      });
      writeStream.on('error', () => {
        reject(new Error('Error writing stream.'));
      });
    }
    catch (err) {
      reject(err);
    }
  });
}
