const { execFile } = require("child_process");
const fs = require("fs");
const path = require("path");

exports.john = async (wordList, hash) => {
  try {
    const cleanHash = hash.replace(/\\/g, "/");
    const hashFilePath = path.join(__dirname, "hash.txt");
    const wordListFilePath = path.join(__dirname, "wordlist.txt");
    fs.writeFileSync(hashFilePath, cleanHash);
    fs.writeFileSync(wordListFilePath, wordList);

    return new Promise((resolve, reject) => {
      const johnProcess = execFile("john", [hashFilePath, `--wordlist=${wordListFilePath}`, "--fork=4"], (err, stdout, stderr) => {
        if (err) console.error(err)
        if (stderr) console.error(stderr)
        if (stdout) {
          if (stdout.includes("No password hashes loaded")) resolve(null);
          const showProcess = execFile("john", [hashFilePath, "--show"], (err, stdout, stderr) => {
            if (err) console.error(err);
            if (stderr) console.error(stderr);
            if (stdout) {
              for (line of stdout.split("\n")) {
                if (line.includes(":")) {
                  const password = line.split(":")[1].trim();
                  console.log(password)
                  resolve(password);
                }
              }
              resolve(null);
            }
          })
        }
      });
    });
  } catch (error) {
    console.error(error);
  }
};