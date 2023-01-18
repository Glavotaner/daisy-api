import { Credentials, JWT } from 'google-auth-library';
import { UserRepository } from '../../repositories/user/user.repository.js';
import { MessagingService, SendOptions } from './messaging.service.js';
import { serviceAccount } from '../../assets/service_account.js';
import fetch, { Response } from "node-fetch";

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
        if (message.channel) {
            // TODO data messages are shown as notifications because they contain a notification payload
            // message.android = { notification: { channel_id: message.channel } };
            delete message.channel;
        }
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

class Messenger {
    private attempt = 0;
    private url: string;
    private body: Record<string, any>;
    private headers: () => Record<string, any>;
    private onUnauthorized: () => Promise<void>;
    constructor({ url, body, headers, onUnauthorized }: { url: string, body: any, headers: any, onUnauthorized: any }) {
        this.url = url;
        this.body = body;
        this.headers = headers;
        this.onUnauthorized = onUnauthorized;
    }

    async send() {
        const body = JSON.stringify(this.body);
        const response = await fetch(this.url, {
            method: 'POST',
            body,
            headers: this.headers(),
        });
        const badRequest = 400;
        const unauthorized = 401;
        const serverError = 500;
        switch (response.status) {
            case badRequest: return this.handleError(response)
            case unauthorized: return this.handleUnauthorized()
            case serverError: return this.handleServerError(response)
        }
    }

    private async handleError(response: Response) {
        const { error } = await response.json() as any;
        throw new Error(error.message);
    }

    private async handleUnauthorized(): Promise<void> {
        if (this.attempt === 0) {
            await this.onUnauthorized();
            return this.retry();
        } else {
            throw new Error('Could not authorize');
        }
    }

    private handleServerError({ headers }: Response) {
        if (this.attempt < 5) {
            const retryAfter = Number(headers?.get('Retry-After') || '0');
            this.retryAfterTimeout(retryAfter);
        } else {
            throw new Error('Could not retry');
        }
    }

    private retryAfterTimeout(retryAfter: number) {
        const retryTimeout = retryAfter || this.attempt * this.attempt;
        setTimeout(() => {
            this.retry();
        }, retryTimeout * 1000);
    }

    private retry() {
        this.attempt++;
        return this.send();
    }
}
