import { User, UserRepository } from "./user.repository.js";
import { CollectionReference, getFirestore } from "firebase-admin/firestore";
import admin from "firebase-admin";

export class UserRepositoryFirestore implements UserRepository {

    private users: CollectionReference;

    constructor() {
        const firestore = getFirestore(admin.apps[0]!);
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