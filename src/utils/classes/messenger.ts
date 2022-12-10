import fetch, { Response } from "node-fetch";

export class Messenger {
    private attempt = 0;
    private url: string;
    private body: Record<string, any>;
    private headers: () => Record<string, any>;
    private onUnauthorized: () => any;
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
        switch (response.status) {
            case 400: {
                return this.handleError(response)
            };
            case 401: {
                return this.handleUnauthorized()
            };
            case 500: {
                return this.handleServerError(response)
            };
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