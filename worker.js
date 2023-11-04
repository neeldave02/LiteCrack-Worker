require("dotenv").config();
const crypto = require("crypto");
const {
  S3,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const {
  SQSClient,
  GetQueueUrlCommand,
  CreateQueueCommand,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} = require("@aws-sdk/client-sqs");

const sqsClient = new SQSClient({});
const s3Client = new S3({});

const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME;

const SQS_QUEUE_URL = process.env.SQS_QUEUE_URL;
const SQS_QUEUE_NAME = process.env.SQS_QUEUE_NAME;

const checkAndCreateQueue = async () => {
  // Check if the queue already exists.
  try {
    const res = await checkQueue(SQS_QUEUE_NAME);
    if (res.QueueUrl) {
      SQS_QUEUE_URL = res.QueueUrl;
      console.log("Queue exists, waiting for messages...");
      PollMessages();
    }
  } catch (err) {
    const res = await createQueue().catch(() =>
      console.log("Failed to create the queue.")
    );
    console.log(res);
  }
};

const checkQueue = async (queueName) =>
  await sqsClient.send(new GetQueueUrlCommand({ QueueName: queueName }));

const createQueue = async (queueName = SQS_QUEUE_NAME) =>
  await sqsClient.send(
    new CreateQueueCommand({
      QueueName: queueName,
    })
  );

const PollMessages = async () => {
  try {
    const command = new ReceiveMessageCommand({
      MaxNumberOfMessages: 1,
      QueueUrl: process.env.SQS_QUEUE_URL,
      WaitTimeSeconds: 5,
      VisibilityTimeout: 5,
      MessageAttributes: ["All"],
    });
    const result = await sqsClient.send(command);
    return result;
  } catch (error) {
    console.error(error);
  }
};

const getFromS3 = async (key) => {
  const command = new GetObjectCommand({
    Bucket: S3_BUCKET_NAME,
    Key: key,
  });
  try {
    const res = await s3Client.send(command);
    const str = await res.Body.transformToString();
    return str;
  } catch (err) {
    console.error(err);
  }
};

const crackHash = async (sha512Hash, wordList) => {
  for (const word of wordList) {
    const hashedWord = crypto.createHash("sha512").update(word).digest("hex");
    if (hashedWord === sha512Hash) {
      return { password: word };
    }
  }
};

const pushToS3 = async (key, data) => {
  const command = new PutObjectCommand({
    Bucket: S3_BUCKET_NAME,
    Key: key,
    Body: data,
  });
  try {
    await s3Client.send(command);
  } catch (error) {
    console.error(error);
  }
};

const deleteSQSMessage = async (SQSMessage) => {
  try {
    await sqsClient.send(
      new DeleteMessageCommand({
        QueueUrl: SQS_QUEUE_URL,
        ReceiptHandle: SQSMessage.Messages[0].ReceiptHandle,
      })
    );
  } catch (error) {
    console.error(error);
  }
};

const deleteS3Object = async (key) => {
  const command = new DeleteObjectCommand({
    Bucket: S3_BUCKET_NAME,
    Key: key,
  });
  try {
    await s3Client.send(command);
  } catch (error) {
    console.error(error);
  }
};

exports.Main = async () => {
  const SQSMessage = await PollMessages();

  if (!SQSMessage.Messages) {
    console.error("There are no messages in queue.");
    return;
  }

  const messageBody = JSON.parse(await SQSMessage.Messages[0].Body);
  const wordListKey = await messageBody.wordlist;
  const hash = await messageBody.hash;

  const wordListValues = await getFromS3(`wordlists/${wordListKey}.txt`);

  const hashKey = (await "hashes/") + wordListKey + hash + ".json";
  const result = await crackHash(hash, wordListValues.split("\n"));

  if (result) {
    await pushToS3(
      `cracked/${hash}.json`,
      JSON.stringify({ hashed: result.password })
    );
    console.log("Cracked hash has been pushed to SQS");
    await deleteSQSMessage(SQSMessage);
    await deleteS3Object(hashKey);
  } else {
    console.error("Failed to crack hash.");
    await deleteSQSMessage(SQSMessage);
    await pushToS3(hashKey, JSON.stringify({ hash: hash, status: "FAILED" }));
  }
};

this.Main();
