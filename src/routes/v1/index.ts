import Elysia from "elysia";
import User from "./User";
import Auth from "./Auth";
import Programs from "./Programs";
import Booking from "./Booking";
import Payment from "./Payment";
import { getThaiDate } from "../../../lib/lib";

const app = new Elysia()
    .group("/auth", app => app.use(Auth))
    .group("/users", app => app.use(User))
    .group("/programs", app => app.use(Programs))
    .group("/bookings", app => app.use(Booking))
    .group("/payments", app => app.use(Payment))
    .get("/datetime", () => getThaiDate())

export default app;