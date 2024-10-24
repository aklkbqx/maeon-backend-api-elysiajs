import Elysia from "elysia";
import Chat from "./Chat"
import Notifications from "./Notifications"

const app = new Elysia()
    .use(Chat)
    .use(Notifications)

export default app;