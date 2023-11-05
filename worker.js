const { getS3Object, putS3Object, deleteS3Object } = require("./s3");
const { deleteSQSMessage, receiveSQSMessages } = require("./sqs");
const { john } = require("./john");

exports.main = async () => {
  while (true) {
    const SQSMessage = await receiveSQSMessages();

    if (SQSMessage?.Messages) {
      const messageBody = JSON.parse(await SQSMessage.Messages[0].Body);
      const wordList = messageBody.wordlist;
      const hash = messageBody.hash;

      const hashKey = "hashes/" + wordList + hash + ".json";
      const wordListKey = "wordlists/" + wordList + ".txt";
      const crackedKey = "cracked/" + hash + ".json";

      const wordListValues = await getS3Object(wordListKey);
      const result = await john(hash, wordListValues);

      if (result) {
        console.log(`Cracked hash: ${hash} for wordlist: ${wordList}.`);

        await putS3Object(crackedKey, JSON.stringify({ hashed: result.password }));
        await deleteSQSMessage(SQSMessage);
        await deleteS3Object(hashKey);
      } else {
        console.error("Failed to crack hash.");

        await deleteSQSMessage(SQSMessage);
        await putS3Object(hashKey, JSON.stringify({ hash: hash, status: "FAILED" }));
      }
    } else {
      console.error("There are no messages in queue.");
    }
  }
};

this.main();