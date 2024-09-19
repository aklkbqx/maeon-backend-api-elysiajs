import Elysia from "elysia";
import User from "./User";
import Auth from "./Auth";

const app = new Elysia()
    .group("/auth", app => {
        return app.use(Auth)
    })
    .group("/users", app => {
        return app.use(User)
    })
export default app;