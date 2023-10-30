require("dotenv").config();
const { SQSClient, GetQueueUrlCommand, CreateQueueCommand, ReceiveMessageCommand } = require("@aws-sdk/client-sqs");
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
        if(res.QueueUrl) {
            SQS_QUEUE_URL = res.QueueUrl; 
            console.log("Queue exists, waiting for messages...");
            waitSQSMessage(); 
        } 
    } catch(err) {
        const res = await createQueue().catch(() => console.log("Failed to create the queue."));
        console.log(res)
    }

  };

  const waitSQSMessage = async (queueURL, maxWaitTime = 300) => {
    const receiveMessageCommand = new ReceiveMessageCommand({
        QueueUrl: queueURL,
        MaxNumberOfMessages: 1,
        WaitTimeSeconds: maxWaitTime,
        });
        const response = await sqsClient.send(receiveMessageCommand);
        return response.Messages;   
    }

  main();