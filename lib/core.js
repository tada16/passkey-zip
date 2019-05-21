'use strict';

const npm = require('../package.json');

const Passkey = require('passkey-sdk');

Passkey.util.updateObject(Passkey, {
  VERSION_SDK: Passkey.VERSION,
  VERSION: npm.version,

  zip: require('./zip'),
  unzip: require('./unzip'),
});

module.exports = Passkey;
