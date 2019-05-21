#!/usr/bin/env node

'use strict';

const npm = require('../package.json');
const passkey = require('../lib/core.js');
const program = require('commander');

// receiver
const receiver = function (msg, progress = 0) {
  console.log(msg);
};

function main() {
  try {
    // command option check.
    program
      .version(npm.version)
      .usage('-f <file> <otp>')
      .option('-f, --file <file>', 'specify encryption zip file')
      .parse(process.argv);

    if ((program.args.length != 1) || (!program.file)) {
      return program.help();
    }

    passkey.unzip(program.args[0], program.file, receiver, function(err, res) {
      if (err) {
        console.log(err.message);
      } else {
        console.log('---------------------------------------');
        console.log('Result   : ' + res.Status);
        console.log('File     : ' + res.File);
      }
    });
  } catch (err) {
    console.error(err.message);
  }
}

main();
