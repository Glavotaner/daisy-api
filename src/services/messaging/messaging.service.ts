export abstract class MessagingService {
    abstract send(options: SendOptions): Promise<void>;
}

export interface SendOptions {
    message: Message;
    to: string;
}

export interface Message {
    notification?: Notification,
    data?: MessageData;
    token?: string;
}

export interface Notification {
    title?: string;
    body?: string;
}

export type MessageData = Record<string, any>;
