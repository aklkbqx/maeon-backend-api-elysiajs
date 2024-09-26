import Elysia from "elysia";
import User from "./User";
import Auth from "./Auth";
import Programs from "./Programs";

const app = new Elysia()
    .group("/auth", app => app.use(Auth))
    .group("/users", app => app.use(User))
    .group("/programs", app => app.use(Programs))


export default app;