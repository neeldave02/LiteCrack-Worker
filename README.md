# LiteCrack-Worker
Worker file for LiteCrack

just use a worker.js file and have it connect to the S3 and SQS 

1 - wait for SQS message...
2 -  sqs message has { hash: aW3828je , bucketpath: wordlist/rockyou.txt }
3 -  pull wordlist from s3 bucket
4 -  run the unhasher function thing
5 -  push password  to S3 buckcketpath     cracked/aW3828je
6 -  delete the sqs message from the queue
..
.
in our s3 bucket i made 

/wordlist/ 

and

/cracked/
.
.
based on our testing we can run 2 or how ever many instances of these workers using pm2