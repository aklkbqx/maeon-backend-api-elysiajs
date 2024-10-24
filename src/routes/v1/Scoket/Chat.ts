import { Elysia, t } from 'elysia'

type ChatMessage = {
    roomId: string
    username: string
    message: string
    timestamp: number
}


const app = new Elysia()
    .ws('/chat/:roomId', {
        body: t.Object({
            username: t.String(),
            message: t.String()
        }),
        params: t.Object({
            roomId: t.String()
        }),
        open(ws) {
            const { roomId } = ws.data.params
            ws.subscribe(roomId)
            ws.publish(roomId, {
                type: 'SYSTEM',
                message: 'New user joined the room',
                timestamp: Date.now()
            })
        },
        message(ws, { username, message }) {
            const { roomId } = ws.data.params

            const chatMessage: ChatMessage = {
                roomId,
                username,
                message,
                timestamp: Date.now()
            }

            ws.publish(roomId, chatMessage)
        },
        close(ws) {
            const { roomId } = ws.data.params
            ws.unsubscribe(roomId)

            ws.publish(roomId, {
                type: 'SYSTEM',
                message: 'User left the room',
                timestamp: Date.now()
            })
        }
    })
    .onError(({ code, error, set }) => {
        console.error(`Error ${code}:`, error);
        set.status = code === 'NOT_FOUND' ? 404 : 500;
        return { error: error.message };
    })


export default app