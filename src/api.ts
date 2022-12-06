import { App } from './app.js';
import { MessagingServiceFcm } from './services/messaging/messaging.service.fcm.js';
import { UserServiceFirestore } from './services/user/users.service.firestore.js';
import { UserRepositoryFirestore } from './repositories/user/user.repository.firestore.js';

const userRepository = new UserRepositoryFirestore();
const messagingService = new MessagingServiceFcm(userRepository);
const userService = new UserServiceFirestore(userRepository, messagingService);
new App(userService, messagingService).start();