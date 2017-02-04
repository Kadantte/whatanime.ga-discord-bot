'use strict';
const discord = require('discord.js');
const client = new discord.Client();
const configs = require('./config.json');

const whatanime = require('./whatanime/');
const whatClient = new whatanime(configs.whatanime);

const commands = ['Whatanime'];

const queuedMsgs = [];

/**
 * Join items together
 * @param {Array} array 'an array of Strings|Numbers'
 * @return {Array}
 */
function joinFields(array) {
  const text = array.length > 0 ? array.join(', ') : '';
  return text !== '' ? text : ''
}

/**
 * Pad Numbers that are single digit
 * @param {number} number 'number'
 * @return {String}
 */
function pad(number) {
  return number < 10 ? `0${number}` : number;
}


/**
 * Converts time to a more natural looking format
 * @param {number} seconds 'time in seconds'
 * @return {String} formatted time
 */
function convertTime(seconds) {
  let minutes = Math.floor(seconds / 60);
  let hours = Math.floor(minutes / 60);
  seconds = Math.round((seconds - (minutes * 60)) * 1000) / 1000;
  minutes = Math.round(minutes - (hours * 60));
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Format whatAnime's response and send to the channel.
 * @param  {Object}  whatAnime 'Object containing the whatAnime response'
 * @param  {Object}  message   'message Object fromd discord.js'
 * @return {Promise}
 */
function whatResponse(whatAnime, message) {
  // TODO: anilist.co connection. Use module from npm
  whatAnime = JSON.parse(whatAnime);
  const embed = new discord.RichEmbed();
  const data = whatAnime.docs[0];

  embed
    .setAuthor('WhatAnime')
    .setColor('#02a9ff')
    .setFooter('powered by https://whatanime.ga/')
    .setThumbnail('https://whatanime.ga/favicon.png')
    .addField(
      'Search Time',
      `${whatAnime.RawDocsSearchTime[0]} milliseconds`
    )
    .addField(
      'Start Time',
      convertTime(data.from),
      true
    )
    .addField(
      'End Time',
      convertTime(data.to),
      true
    )
    .addField(
      'Episode',
      data.episode
    )
    .addField(
      'Accuracy',
      `${data.similarity * 100}%`
    )
    .addField(
      'title',
      data.title,
      true
    )
    .addField(
      'English Title',
      data.title_english,
      true
    )
    .addField(
      'Romaji Title',
      data.title_romaji,
      true
    )

  // XXX: Special Case; Bad request if field is empty
  if (joinFields(data.synonyms) !== '') {
    embed.addField(
      'Synonyms',
      joinFields(data.synonyms)
    );
  }

  return message.channel.sendEmbed(embed).catch(console.log);
}

/**
 * Catch Errors
 * @param {*} err 'Error'
 */
function handleError(err) {
  console.log('error:');
  console.log(err);
}

/**
 * Check if image is validation
 * @param  {Object} linkEmbed 'Embedlink from discord.js'
 * @return {Promise}          'URL of link'
 */
function checkForImage(linkEmbed) {
  return new Promise((res, rej) => {
    if (linkEmbed.type === 'image') {
      res(linkEmbed.url);
    }
    else {
      rej(`Requested an image, found ${linkEmbed.type} instead`);
    }
  })
}

/**
 * Confirm if prefix is correct
 * @param  {Object}  message 'message object from discord.js'
 * @param  {String}  context 'cleaned message string'
 * @return {Promise}         'command and argument string'
 */
function confirmPrefix(message, context) {
  return new Promise((resolve, reject) => {
    const prefix = configs.discordPrefix;
    const validPrefix = context.substring(0, prefix.length);
    const args = context.substr(prefix.length);

    if (prefix === validPrefix) {
      resolve({
        message,
        args
      });
    }
  })
}

/**
 * Queues message for messageEvent to fire
 * @param {String} messageID 'message string'
 * @return {Array}           'updated messagequeue array'
 */
function queueEmbed(messageID) {
  return queuedMsgs.push(messageID);
}

/**
 * Returns image through chain promising
 * @param  {Object}  obj 'an object containing a message object'
 * @return {Promise}
 */
function embedResponse(obj) {
  return checkForImage(obj.message.embeds[0])
    .then((res) => {
      return whatClient.findAnime(res)
    })
    .then((res) => {
      return whatResponse(res, obj.message);
    })
    .catch(handleError);
}

/**
 * Use command with arguments
 * @param  {Object} obj 'object containing a message and its cleaned text'
 */
function activateCommand(obj) {
  const context = obj.args;
  const args = context.split(' ');
  const cmd = args.shift();

  if (commands.indexOf(cmd) !== -1) {
    switch (cmd) {
      case 'Whatanime':
        if (obj.message.embeds.length > 0) {
          embedResponse(obj);
        }
        else {
          queueEmbed(obj.message.id);
        }
        break;
    }
  }
}

client.on('ready', () => {
  console.log('client is ready and is now connected');
})

client.on('message', (msg) => {
  /**
   * TODO
   * [X] Command Check
   * [X] Download file if embed, checking the embed array (message.embeds > 0, embedItem.url, embItem.type = image) if it's an image that's downloadable and the URL to do so
   * [X] use whatanime api and upload file to find and respond
   * [ ] return and check validation for any found animes, top 1 results
   * 5) respectively link using anilist.co / mal / some anime site api for easier response
   */
  confirmPrefix(msg, msg.cleanContent)
    .then(activateCommand)
})

client.on('messageUpdate', (oldmsg, newmsg) => {
  const order = queuedMsgs.indexOf(newmsg.id);
  if (order !== -1) {
    embedResponse({
        message: newmsg
      })
      .then(() => {
        queuedMsgs.splice(order, 1)
      });
  }
});

client.login(configs.discordToken);
