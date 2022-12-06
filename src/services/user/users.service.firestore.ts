import { User, UserRepository } from "../../repositories/user/user.repository.js";
import { MessageData, MessagingService, Notification } from "../messaging/messaging.service.js";
import { PairResponseData, RegistrationData, RequestPairData, UserService } from "./user.service.js";

export class UserServiceFirestore implements UserService {
    constructor(
        private userRepository: UserRepository,
        private messagingService: MessagingService,
    ) { }

    async register({ username, token }: RegistrationData) {
        return this.userRepository.tryGetUser(username, {
            onFound: () => { throw new UserRegisteredException() },
            onNotFound: () => this.userRepository.create({ username, token }),
        });
    }

    async requestPair({ requestingUsername, pairUsername }: RequestPairData) {
        return this.userRepository.tryGetUser(pairUsername, {
            onFound: async ({ username }) => {
                const pairingCode = this.getPairingCode();
                await this.setPairingCode({ pairUsername, pairingCode });
                await this.sendPairingRequest({ requestingUsername, respondingUsername: username, pairingResponse: pairingCode })
            },
            onNotFound: () => { throw new UserDoesNotExistException() },
        });
    }

    async respondPair({ requestingUsername, respondingUsername, pairingResponse }: PairResponseData) {
        const respondingUser = (await this.userRepository.get({ username: respondingUsername }))!;
        if (pairingResponse === respondingUser.pairingCode) {
            const requestingUser = (await this.userRepository.get({ username: requestingUsername }))!;
            await this.sendPairingResponse({ respondingUsername: respondingUser.username, requestingUser: requestingUser });
            await this.setPairingCode({ pairUsername: respondingUser.username, pairingCode: undefined });
        } else {
            throw new PairingFailedException();
        }
    }

    private async sendPairingRequest({ requestingUsername, respondingUsername, pairingResponse }: PairResponseData) {
        const pairingRequest = { requestingUsername, pairingResponse };
        const notification = {
            title: 'Pairing requested',
            body: `${requestingUsername} wants to pair with you!`,
        };
        await this.sendPairingData({ data: pairingRequest, notification, to: respondingUsername })
    }

    private async sendPairingResponse({ respondingUsername, requestingUser }: { respondingUsername: string, requestingUser: User }) {
        const pairingResponse = { confirmedPair: requestingUser.username };
        const notification = {
            title: 'Pairing successful',
            body: `You are now paired with ${requestingUser.username}!`,
        };
        await this.sendPairingData({ data: pairingResponse, notification, to: respondingUsername });
    }

    private async sendPairingData({ data, notification, to }: { data: MessageData, notification: Notification, to: string }) {
        await this.messagingService.send({ message: { data, notification }, to });
    }

    private getPairingCode() {
        const randomNumber = Math.random().toString();
        return randomNumber.slice(2, 8);
    }

    private setPairingCode({ pairUsername, pairingCode }: { pairUsername: string, pairingCode: string | undefined }) {
        return this.userRepository.update(pairUsername, { pairingCode });
    }

}

class UserRegisteredException extends Error {
    constructor() {
        super('User exists!');
    }
}

class UserDoesNotExistException extends Error {
    constructor() {
        super('User does not exist!');
    }
}

class PairingFailedException extends Error {
    constructor() {
        super('Pairing code incorrect!');
    }
}
