'use strict';
const request = require('request');
const requestP = require('request-promise');
const querystring = require('querystring');
const datauri = require('datauri');
const whatanimeEndpoint = 'https://whatanime.ga/';
const temp = './tempImage';

/**
 * Download the image to a temporary location
 * @param  {String} imageURL 'Image URL'
 * @return {Promise}         'Temporary file save location if successful'
 */
function downloadImage(imageURL) {
  return new Promise((res, rej) => {
    // TODO double check if file extensions are necessary to use when uploading in wahatanime
    request(imageURL).pipe(fs.createWriteStream(temp)).on('close', res(temp));
  })
}

/**
 * Use API to search
 * @param  {String} imageFile 'File location'
 * @return {Promise}          'JSON response if successful'
 */
function animeSearch(imageFile) {
  const data = new datauri(imageFile);
  const formData = querystring.stringify({image: data.content});
  const contentLength = formData.length;

  return new Promise((respond, reject) => {
    request({
      headers: {
        'Content-Length': contentLength,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      uri: `${whatanimeEndpoint}/api/search?token=${this.api}`,
      body: formData,
      method: 'POST'
    }, (err, res, body) => {
      if (err) reject(err);
      if (res.body.error) reject(res.body.error);
      if (res.statusCode == 429) {
        reject(body);
      };
      if (res.statusCode == 413) {
        reject('Filesize Too Big');
      };
      if (res.statusCode == 200) {
        respond(body);
      }
    });
  });
}

class whatanime {
  constructor(api) {
    this.api = api;
    this.whatanime = 'https://whatanime.ga/'
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
  }
}

module.exports = whatanime;
