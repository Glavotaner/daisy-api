import { CollectionReference, Firestore } from "@google-cloud/firestore";
import { User, UserRepository } from "./user.repository.js";
import { serviceAccount } from '../../assets/service_account.js';

export class UserRepositoryFirestore implements UserRepository {

    private users: CollectionReference;

    constructor() {
        const firestore = new Firestore({
            credentials: { client_email: serviceAccount.client_email, private_key: serviceAccount.private_key },
            projectId: serviceAccount.project_id,
        });
        this.users = firestore.collection('users');
    }

    async get({ username }: { username: string }): Promise<User | undefined> {
        const query = await this.users.where('username', '==', username).get();
        const [userDoc] = query.docs;
        return userDoc?.data() as User;
    }

    update(username: string, properties: Record<string, any>) {
        return this.users.doc(username).update(properties);
    }

    create({ username, token }: User) {
        return this.users.doc(username).set({ username, token });
    }

}