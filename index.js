'use strict';
const discord = require('discord.js');
const client = new discord.Client();
const configs = require('./config.json');

const whatanime = require('./whatanime/');
const whatClient = new whatanime(configs.whatanimeToken);

/**
 * Log resulted promise
 * @param  {*}       item  'Any type of promise result'
 * @return {Promise}       'Successful Logging'
 */
function logResult(item) {
  console.log(item);
  return new Promise((res) => {res('Successfully Logged')});
}

/**
 * Check if image is validation
 * @param  {Object} linkEmbed 'Embedlink from discord.js'
 * @return {Promise}          'URL of link'
 */
function tempImage(linkEmbed) {
  return new Promise((res, rej) => {
    if (linkEmbed.type !== 'image') {
      // TODO WhatanimeAPI
      res(linkEmbed.url);
    } else {
      rej(`Requested an image, found ${linkEmbed.type} instead`);
    }
  })
}

client.on('ready', () => {
  console.log('client is ready and is now connected');
  client.destroy(); // XXX: Temp code for specific testing purposes
})

client.on('message', (msg) => {
  /**
   * TODO
   * 1) Command Check
   * 2) Download file if embed, checking the embed array (message.embeds > 0, embedItem.url, embItem.type = image) if it's an image that's downloadable and the URL to do so
   * 3) use whatanime api and upload file to find and respond
   * 4) return and check validation for any found animes, top 3 results
   * 5) respectively link using anilist.co / mal / some anime site api for easier response
   */
})

client.login(configs.discordToken)
