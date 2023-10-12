import { UserRepository } from '../../repositories/user/user.repository.js';
import { MessagingService, SendOptions } from './messaging.service.js';
import {Messaging, getMessaging} from 'firebase-admin/messaging';

export class MessagingServiceFcm implements MessagingService {
    private messaging: Messaging = getMessaging();

    constructor(private userRepository: UserRepository) {
    }

    async send({ message, to }: SendOptions) {
        const recipient = await this.userRepository.get({ username: to });
        if (!recipient) {
            throw new RecipientNotFoundException();
        } else if (!recipient.token) {
            throw new RecipientTokenNotFoundException();
        }
        message.token = recipient.token;
        if (message.channel) {
            // TODO data messages are shown as notifications because they contain a notification payload
            // message.android = { notification: { channel_id: message.channel } };
            delete message.channel;
        }
        await this.messaging.send(message as any);
    }
}

export class RecipientNotFoundException extends Error {
    constructor() {
        super('Recipient is gone!');
    }
}

export class RecipientTokenNotFoundException extends Error {
    constructor() {
        super('Recipient token is missing!');
    }
}
