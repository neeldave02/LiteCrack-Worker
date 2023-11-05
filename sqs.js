require("dotenv").config();
const { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } = require("@aws-sdk/client-sqs");

const sqsClient = new SQSClient({ region: "ap-southeast-2"});

const SQS_QUEUE_URL = process.env.SQS_QUEUE_URL;

exports.getQueueURL = async (queueName) =>
    await sqsClient.send(new GetQueueUrlCommand({ QueueName: queueName }));


exports.receiveSQSMessages = async () => {
    try {
        const command = new ReceiveMessageCommand({
            MaxNumberOfMessages: 1,
            QueueUrl: process.env.SQS_QUEUE_URL,
            WaitTimeSeconds: 5,
            VisibilityTimeout: 300,
            MessageAttributes: ["All"],
        });
        const result = await sqsClient.send(command);
        return result;
    } catch (error) {
        console.error(error);
    }
};

exports.deleteSQSMessage = async (SQSMessage) => {
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