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
      .usage('-g <group_id> <file ...>')
      .option('-g, --group <group_id>', 'specify group id')
      .parse(process.argv);

    if ((!program.args.length) || (!program.group)) {
      return program.help();
    }

    passkey.zip(program.group, program.args, receiver, function(err, res) {
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
