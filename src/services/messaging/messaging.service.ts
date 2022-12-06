export abstract class MessagingService {
    abstract send(options: { message: Message, to: string }): Promise<void>;
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
