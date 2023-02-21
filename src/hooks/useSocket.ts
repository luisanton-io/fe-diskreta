import { refreshToken } from "API/refreshToken"
import { userState } from "atoms/user"
import useArchiveMessage from "pages/Main/handlers/useArchiveMessage"
import useMessageStatus from "pages/Main/handlers/useMessageStatus"
import { useEffect, useMemo } from "react"
import { useRecoilValue } from "recoil"
import { io } from "socket.io-client"

export default function useSocket() {

    const user = useRecoilValue(userState)

    const { token } = user || {}

    const socket = useMemo(() => {
        return !!token && io(process.env.REACT_APP_BE_DOMAIN!, { transports: ['websocket'], auth: { token } })
    }, [token])


    const archiveMessage = useArchiveMessage()

    const handleMessageStatus = useMessageStatus()

    useEffect(() => {
        if (!socket) return

        const handleArchiveMessage = (message: ReceivedMessage, ack: Function) => {
            try {
                archiveMessage(message, { showToast: true })
                ack(JSON.stringify({ "hash": message.hash }))
            } catch (error) {
                ack(JSON.stringify({ error: (error as Error) }))
            }
        }

        const handleDequeue = (queue: Queue, ack: Function) => {
            const { messages = [], status = [] } = queue || {}
            try {
                console.log(queue)
                messages.forEach(msg => archiveMessage(msg, { showToast: false }))
                status.forEach(msg => handleMessageStatus(msg))
                ack()
            } catch (error) {
                console.log("Handle dequeue error:", error)
                ack((error as Error).message)
            }
        }

        const handleRefreshToken = () => {
            socket.disconnect()
            refreshToken()
        }


        socket.on('in-msg', handleArchiveMessage)
        socket.on('msg-status', handleMessageStatus)
        socket.on('dequeue', handleDequeue)
        socket.on('connect_error', handleRefreshToken);

        return () => {
            socket.off('in-msg', handleArchiveMessage)
            socket.off('msg-status', handleMessageStatus)
            socket.off('dequeue', handleDequeue)
            socket.off('connect_error', handleRefreshToken);
        }

    }, [socket, archiveMessage, handleMessageStatus])

    return socket
}