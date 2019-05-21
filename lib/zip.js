'use strict';

const os = require('os');
const archiver = require('archiver');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const passkey = require('passkey-sdk');

async function zip(groupId, argFiles, receiver, cb) {
  try {
    // setup
    const files = validate(groupId, argFiles);
    const filePath = setFilePath(files);

    if (receiver) receiver(`[1/3] create zip file: ${filePath.zip}`, 0);

    // get password
    const group = new passkey.Group();
    group.set({GroupId: groupId});
    const pwd = await group.createPassword();
    filePath.encryption += '.' + pwd.getId();

    // archive + encrypto
    createZipFile(filePath, files, pwd.getPassword(), receiver, cb);
  } catch (err) {
    cb(err, null);
  }
}

function createZipFile(filePath, files, password, receiver, cb) {
  // Zip     : files -> files.zip
  // Encrypt : files.zip -> files.zip.passwordId

  let output = fs.createWriteStream(filePath.zip);
  let archive = archiver.create('zip', {});

  // set event handler
  output.on('close', function() {
    encryptoZipFile(filePath, password, receiver, cb);
  });

  archive.on('warning', function(err) {
    if (err.code === 'ENOENT') {
      if (receiver) receiver(`> Warning: ${err.message}`);
    } else {
      cb(err, null);
    }
  });

  archive.on('error', function(err) {
    cb(err, null);
  });

  archive.pipe(output);

  // add target
  for (let file of files) {
    let name = path.basename(file);
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
      // directory
      if (receiver) receiver(`      + D: ${file}`);
      archive.directory(file, path.join(filePath.workDirName, name));
    } else {
      // file
      if (receiver) receiver(`      + F: ${file}`);
      archive.file(file, {name: path.join(filePath.workDirName, name)});
    }
  }
  // do zip
  archive.finalize();
}

function validate(groupId, argFiles) {
  const files = [];
  if (!groupId) {
    throw new Error('group id is required');
  }
  if (argFiles instanceof Array) {
    if (argFiles.length === 0) {
      throw new Error('file not specified');
    } else {
      for (let file of argFiles) {
        files.push(path.resolve(file));
      }
    }
  } else {
    throw new Error('file not specified');
  }
  return files;
}

function encryptoZipFile(filePath, password, receiver, cb) {
  try {
    if (receiver) receiver(`[2/3] encrypto zip file : ${filePath.encryption}`, 0);

    const inData = fs.readFileSync(filePath.zip);
    const cipherData = getCipher(inData, 'aes-256-cbc', password);
    fs.writeFileSync(filePath.encryption, cipherData);

    fs.unlinkSync(filePath.zip);

    if (receiver) receiver(`[3/3] remove zip file : ${filePath.zip}`, 0);
    cb(null, passkey.util.resultOk({File: filePath.encryption}));
  } catch (err) {
    cb (err, null);
  }
}

function setFilePath(files) {
  try {
    const filePath = {
      zip: '',
      encryption: '',
      workDirName: ''
    };

    if (files.length == 1) {
      // 1 file (directory) : zip file name = fiels[0]
      filePath.zip = path.join(os.tmpdir(), path.basename(files[0])) + '.zip';
      filePath.encryption = files[0] + '.zip';
    } else {
      // many files : zip file name = parent directory name
      let currentPath = path.dirname(files[0]);
      let parentPath = path.dirname(currentPath);
      let parentDirName = currentPath.substr(parentPath.length + 1);
      filePath.zip = path.join(os.tmpdir(), parentDirName) + '.zip';
      filePath.encryption = path.join(currentPath, parentDirName) + '.zip';
      filePath.workDirName = parentDirName;
    }
    // TODO. over writte check

    return filePath;
  } catch (err) {
    throw err;
  }
}

function getCipher(data, algorithm, password) {
  let cipher = crypto.createCipher(algorithm, password);
  return Buffer.concat([cipher.update(data), cipher.final()]);
}

module.exports = zip;
