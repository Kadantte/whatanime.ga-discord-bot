'use strict';
const request = require('request');
const requestP = require('request-promise'); // TODO delete since unneecsssary in the future
const sharp = require('sharp');;
const querystring = require('querystring');
const fs = require('fs');
const datauri = require('datauri');
const whatanimeEndpoint = 'https://whatanime.ga/';
const temp = './tempImage';
const tempUpdated = './tempImageUpdated'

// TODO: header check function to prevent unnecessarily large files over X MB

/**
 * Reduces filesize to maneagable levels
 * @param {Object} obj 'Object containing an imag file location and apie
 * @return {Promise}'
 */
function reduceSize(obj) {
  return new Promise((result, reject) => {
      const file = `${tempUpdated}${Date.now()}.jpg`;
      setTimeout(() => {
            sharp(obj.imageFile)
      .resize(1280, 720)
      .jpeg({
        quality: 80
      })
      .toFile(file, (err, res) => {
        if (err) throw err;
        setTimeout(() => {
          fs.unlink(obj.imageFile, (err) => {
            if (err) console.log('could not delete file'); // TODO Consider actual error instead
          });
        }, 1000)
        result({imageFile: file, api: obj.api})
      })
    }, 3000) // HACK: Delay time to process image. Started to have issues post 1MB
  })
}

/**
 * Download the image to a temporary location
 * @param  {String} imageURL 'Image URL'
 * @return {Promise}         'Temporary file save location if successful'
 */
function downloadImage(imageURL, api) {
  return new Promise((res, rej) => {
    const file = `${temp}${Date.now()}.jpg`;
    // TODO double check if file extensions are necessary to use when uploading in wahatanime
    request(imageURL).pipe(fs.createWriteStream(file)).on('close', res({imageFile: file, api}));
  })
}

/**
 * Use API to search
 * @param  {String} imageFile 'File location'
 * @return {Promise}          'JSON response if successful'
 */
function animeSearch(obj) {
  // HACK: timeout delay by a full second to allow write to finish. Consider having a read / write / delete in the future
  return new Promise(function (resolve, reject) {
      setTimeout(function () {
        const fileLocation = `${obj.imageFile.replace('./', '')}`;
        const data = new datauri(fileLocation);
        const formData = querystring.stringify({image: data.content});
        const contentLength = formData.length;
        
        request({
          headers: {
            'Content-Length': contentLength,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          uri: `${whatanimeEndpoint}/api/search?token=${obj.api}`,
          body: formData,
          method: 'POST'
        },
        (err, res, body) => {
        setTimeout(() => {
          fs.unlink(obj.imageFile, (err) => {
              if (err) console.log('could not delete file'); // TODO Consider actual error
            });
          }, 1000)
          if (err) reject(err)
          else if (res.body.error) reject(res.body.error)
          else if (res.statusCode == 429) {
            reject(body);
          }
          else if (res.statusCode == 413) {
            reject('Filesize Too Big');
          }
          else if (res.statusCode == 200) {
            resolve(body);
          }
        });
      }, 1000); // HACK: originally before image filesize reducing, 
  });
}

class whatanime {
  constructor(api) {
    this.api = api;
    this.whatanime = 'https://whatanime.ga/';
  }

  /**
   * Returns userinfo name and id
   * https://soruly.github.io/whatanime.ga/#/?id=me
   * @return {Promise} "JSON promise to chain by"
   */
  get user() {

    return requestP(`${this.whatanime}/api/me?token=${this.api}`);
  }

  /**
   * Finds the anime using the image downloaded
   * https://soruly.github.io/whatanime.ga/#/?id=search
   * @type {String} image "Image URL"
   * @return {Promise} JSON response image
   */
  findAnime(imageURL) {
    // TODO create image search
    return downloadImage(imageURL, this.api)
    .then(reduceSize)
    .then(animeSearch);
  }
}

module.exports = whatanime;