const request = require('request');
const Path = require('path');
const sleep = require('sleep-async')();
const retryDelaySecs = 5;

module.exports = {
  getScreenshot,
  captureScreenshot,
  retrieveScreenshot
};

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

function captureScreenshot(apikey, captureRequest) {
  return new Promise( (resolve, reject) => {
    var post_options = {
      uri: 'https://api.screenshotapi.io/capture',
      port: '443',
      method: 'POST',
      headers: { 'apikey': apikey },
      body: JSON.stringify(captureRequest)
    };

    // console.log(`Requesting capture for ${captureRequest.url}`);
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
          // console.log('Accepted request with key: ' + json_results.key);
          resolve(json_results.key);
        }
      }
    });
  });
}

function retrieveScreenshot(apikey, key, saveToPath) {
  return new Promise( (resolve, reject) => {
    // console.log(`Trying to retrieve: ${key}`);
    const retrieve_url = 'https://api.screenshotapi.io/retrieve?key=' + key;
    const options = { headers: { 'apikey': apikey } };

    request.get(retrieve_url,options, (error,response,body) => {
      if (error) {
        reject(error);
      } else {
        let json_results = JSON.parse(body);
        if (json_results.status === 'ready') {
          let localFile = Path.join(saveToPath, `${key}.png`);
          download(json_results.imageUrl, localFile)
          .then( () => {
            // console.log(`Saved screenshot to ${localFile}`)
            resolve(localFile);
          })
          .catch( (err) => {
            // console.error(err, 'Error saving screenshot');
            reject(err);
          })
        } else {
          // console.log(`Screenshot not yet ready.. waiting for ${retryDelaySecs} seconds.`);
          sleep.sleep(
            retryDelaySecs * 1000, () => {
              retrieveScreenshot(apikey, key, saveToPath)
                .then( (localFile) => resolve(localFile) )
                .catch( (err) => reject(err) );
            });
        }
      }
    });
  });
}

function download(imageUrl, localFile) {
  return new Promise( (resolve, reject) => {
    try {
      // console.log(`Downloading ${imageUrl}`);
      const fs = require('fs');
      let imageStream = request(imageUrl);
      let writeStream = fs.createWriteStream(localFile);
      imageStream.pipe(writeStream);
      writeStream.on('finish', () => {
        resolve();
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
