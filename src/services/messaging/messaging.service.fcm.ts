import { Credentials, JWT } from 'google-auth-library';
import { UserRepository } from '../../repositories/user/user.repository.js';
import { Messenger } from './messenger.js';
import { MessagingService, SendOptions } from './messaging.service.js';
import { serviceAccount } from '../../assets/service_account.js';

export class MessagingServiceFcm implements MessagingService {
    private readonly fcmAccessScope = 'https://www.googleapis.com/auth/firebase.messaging';
    private jwt: JWT;
    private url: string;
    private accessToken: Credentials | undefined;
    private get messageHeaders() {
        return {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + this.accessToken?.access_token,
        };
    }

    constructor(private userRepository: UserRepository) {
        const { client_email, private_key, project_id } = serviceAccount;
        this.jwt = new JWT({ email: client_email, key: private_key, scopes: this.fcmAccessScope });
        this.url = `https://fcm.googleapis.com/v1/projects/${project_id}/messages:send`;
    }

    async send({ message, to }: SendOptions) {
        const recipient = await this.userRepository.get({ username: to });
        if (!recipient) {
            throw new RecipientNotFoundException();
        } else if (!recipient.token) {
            throw new RecipientTokenNotFoundException();
        }
        message.token = recipient.token;
        const options = { url: this.url, body: { message }, headers: () => this.messageHeaders };
        const request = new Messenger({ ...options, onUnauthorized: () => this.refreshAccessToken() });
        return request.send();
    }

    private async refreshAccessToken() {
        this.accessToken = await this.jwt.authorize();
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
