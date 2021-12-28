import logger from "./logging";
import { RetryQueue } from "./retryQueue";

const errorTypes = {
    retriable: [
        'dbError',
        'requestError'
    ],
}

const errorCodes ={
    timeOut: 408,
    internal: 500,
    unauthorized: 401
}

interface Error {
    type?: string;
    code?: number;
    message: string;
    entity: string;
}

const retryJob = async (job: CallableFunction) => { 
    const errorQueue = new RetryQueue('error');
    errorQueue.createWorker(job);

    return await errorQueue.createJob()
}

export const handleError = async (error: Error, task?: CallableFunction) => {
    if (
        error.code &&
        error.code === errorCodes.timeOut ||
        error.type &&
        errorTypes.retriable.includes(error.type)
    ) {
        if (task) {
            const retry = await retryJob(task);
            retry.on('failed', () => logger.error(error));
        } else {
            logger.error(error);
        }
    } else {
        logger.error(error);
    }
}

