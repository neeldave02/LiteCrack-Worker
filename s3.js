require("dotenv").config();
const { S3Client, GetObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");

const s3Client = new S3Client({});
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME;

exports.deleteS3Object = async (key) => {
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

exports.putS3Object = async (key, body) => {
    const upload = new Upload({
        client: s3Client,
        params: {
            Bucket: S3_BUCKET_NAME,
            Key: key,
            Body: body,
        },
    });

    await upload.done();
};

exports.getS3Object = async (key) => {
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