'use strict';

const os = require('os');
const unzipper = require('unzipper');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const passkey = require('passkey-sdk');

async function unzip(otp, argFile, receiver, cb) {
  try {
    // setup
    const file = validate(otp, argFile);
    const filePath = setFilePath(file);

    if (receiver) receiver(`[1/3] decrypto zip file: ${file}`, 0);

    // get password
    const pwd = new passkey.Password();
    const res = await pwd.verify(otp, filePath.passwordId);

    // decrypto + unzip
    decryptoZipFile(filePath, pwd.getPassword(), receiver, cb);
  } catch (err) {
    cb(err, null);
  }
}


function decryptoZipFile(filePath, password, receiver, cb) {
  try {
    let inData = fs.readFileSync(filePath.encryption);
    let decipherData = getDecipher(inData, 'aes-256-cbc', password);

    fs.writeFileSync(filePath.zip, decipherData);

    if (receiver) receiver(`[2/3] unzip : ${filePath.zip}`, 0);
    fs.createReadStream(filePath.zip)
      .pipe(unzipper.Extract({path: filePath.save}));

    if (receiver) receiver(`[3/3] remove zip file : ${filePath.zip}`, 0);
    fs.unlinkSync(filePath.zip);

    cb(null, passkey.util.resultOk({File: filePath.save}));
  } catch (err) {
    cb(err, null);
  }
}


function validate(otp, argFile) {
  if (!otp) {
    throw new Error('otp is required');
  }
  if (!argFile) {
    throw new Error('file is required');
  }
  return path.resolve(argFile);
}

function setFilePath(file) {
  try {
    const filePath = {
      zip: '',
      save: '',
      encryption: '',
      passwordId: ''
    };

    // get passwordId : file.zip.<passwordId>
    filePath.passwordId = file.substr(-7);

    filePath.zip = path.join(os.tmpdir(), filePath.passwordId) + '.zip';
    filePath.save = path.dirname(file);
    filePath.encryption = file;

    // TODO. over writte check

    return filePath;
  } catch (err) {
    throw err;
  }
}

function getDecipher(data, algorithm, password) {
  let decipher = crypto.createDecipher(algorithm, password);
  return Buffer.concat([decipher.update(data), decipher.final()]);
}

module.exports = unzip;
