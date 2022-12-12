import { User, UserRepository } from "../../repositories/user/user.repository.js";
import { MessageData, MessagingService, Notification } from "../messaging/messaging.service.js";
import { PairRequestData, PairResponseData, RegistrationData, RequestPairData, UserService } from "./user.service.js";

export class UserServiceFirestore implements UserService {

    private get randomPairingCode(): string {
        const randomNumber = Math.random().toString();
        return randomNumber.slice(2, 8);
    }

    constructor(
        private userRepository: UserRepository,
        private messagingService: MessagingService,
    ) { }

    async register(registrationData: RegistrationData) {
        const user = await this.userRepository.get({ username: registrationData.username });
        if (user == null) {
            await this.userRepository.create(registrationData);
        } else {
            throw new UserRegisteredException();
        }
    }

    async requestPair({ requestingUsername, pairUsername }: RequestPairData) {
        const user = await this.userRepository.get({ username: pairUsername });
        if (user != null) {
            const pairingCode = this.randomPairingCode;
            await this.setPairingCode({ pairUsername, pairingCode });
            await this.sendPairingRequest({ requestingUsername, respondingUsername: user.username, pairingCode })
        } else {
            throw new UserDoesNotExistException();
        }
    }

    async respondPair({ requestingUsername, respondingUsername, pairingResponse }: PairResponseData) {
        const respondingUser = (await this.userRepository.get({ username: respondingUsername }))!;
        if (pairingResponse === respondingUser.pairingCode) {
            const requestingUser = (await this.userRepository.get({ username: requestingUsername }))!;
            await this.sendPairingResponse({ respondingUsername: respondingUser.username, requestingUser });
            // TODO fix
            // await this.setPairingCode({ pairUsername: respondingUser.username, pairingCode: undefined });
        } else {
            throw new PairingFailedException();
        }
    }

    private async sendPairingRequest({ requestingUsername, respondingUsername, pairingCode }: PairRequestData) {
        const pairingRequest = { requestingUsername, pairingCode };
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
        await this.messagingService.send({
            message: { data, notification, channel: 'pairing' },
            to
        });
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
