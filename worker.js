require("dotenv").config();
const {
  SQSClient,
  GetQueueUrlCommand,
  CreateQueueCommand,
  ReceiveMessageCommand,
} = require("@aws-sdk/client-sqs");
const { error } = require("console");

const sqsClient = new SQSClient({});
const SQS_QUEUE_NAME = process.env.SQS_QUEUE_NAME;

var SQS_QUEUE_URL = "";

const checkQueue = async (queueName) =>
  await sqsClient.send(new GetQueueUrlCommand({ QueueName: queueName }));

const createQueue = async (queueName = SQS_QUEUE_NAME) =>
  await sqsClient.send(
    new CreateQueueCommand({
      QueueName: queueName,
    })
  );

const main = async () => {
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

const PollMessages = async () => {
  try {
    const command = new ReceiveMessageCommand({
      MaxNumberOfMessages: 1,
      QueueUrl: process.env.SQS_QUEUE_URL,
      WaitTimeSeconds: 5,
      MessageAttributes: ["All"],
    });
    const result = await sqsClient.send(command);
    console.log(result.Messages?.Body);
  } catch (error) {
    console.error(error);
  }
};

main();
