import express, { Router } from 'express';
import { RecipientNotFoundException, RecipientTokenNotFoundException } from './services/messaging/messaging.service.fcm.js';
import { MessagingService } from './services/messaging/messaging.service.js';
import { UserService } from './services/user/user.service.js';

export class App {
    private app = express();
    private api = express.Router();
    private user = express.Router();
    private messaging = express.Router();
    constructor(
        private userService: UserService,
        private messagingService: MessagingService,
    ) {
        this.initializeUser();
        this.initializeMessaging();
        this.app.use("/api", this.api);
    }

    start() {
        this.app.listen(3000, () => console.log("started"));
    }

    initializeUser() {
        this.user.use(express.json());
        this.setupController('user', this.user, () => {
            this.user.post("/register", async ({ body }, res) => {
                try {
                    await this.userService.register(body);
                } catch (exception) {
                    return res.status(400).send(getErrorMessage(exception));
                }
                res.status(200).send();
            });
            this.user.post("/requestPair", async ({ body }, res) => {
                try {
                    await this.userService.requestPair(body);
                } catch (exception) {
                    return res.status(400).send(getErrorMessage(exception));
                }
                res.status(200).send();
            });
            this.user.post("/respondPair", async ({ body }, res) => {
                try {
                    await this.userService.respondPair(body);
                } catch (exception) {
                    return res.status(400).send(getErrorMessage(exception));
                }
                res.status(200).send();
            });
        });
    }

    initializeMessaging() {
        this.messaging.use(express.json());
        this.setupController('messaging', this.messaging, () => {
            this.messaging.post("/send", async ({ body }, res) => {
                try {
                    await this.messagingService.send(body);
                    res.status(200).send();
                } catch (exception) {
                    let status = 400;
                    if (exception instanceof RecipientNotFoundException || exception instanceof RecipientTokenNotFoundException) {
                        status = 404;
                    }
                    res.status(status).send(getErrorMessage(exception));
                }
            });
        });
    }

    setupController(route: string, controller: Router, setup: any) {
        this.setTestEndpoint(controller);
        setup();
        this.wireControllerToApi(route, controller);
    }

    wireControllerToApi(route: string, controller: Router) {
        this.api.use(`/${route}`, controller);
    }

    setTestEndpoint(router: Router) {
        router.get("/test", (req, res) => {
            const url = '' + req.baseUrl;
            res.status(200).send(url.replace('/api/', ' ') + ' works');
        });
    }
}

const getErrorMessage = (error: unknown) => {
    return error instanceof Error ? error.message : 'Something went wrong';
}
