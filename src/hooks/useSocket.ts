import { refreshToken } from "API/refreshToken"
import { focusState } from "atoms/focus"
import { userState } from "atoms/user"
import { pki } from "node-forge"
import useArchiveMessage from "pages/Main/handlers/useArchiveMessage"
import useMessageStatus from "pages/Main/handlers/useMessageStatus"
import { useEffect, useMemo } from "react"
import { useRecoilValue } from "recoil"
import { io } from "socket.io-client"

const isTokenExpired = (token?: string) => {
    return token && Date.now() >= (JSON.parse(atob(token.split('.')[1]))).exp * 1000
}

export default function useSocket() {

    const user = useRecoilValue(userState)
    const privateKey = useMemo(() => {
        try {
            return (!user?.privateKey) ? null : pki.privateKeyFromPem(user.privateKey)
        } catch {
            return null
        }
    }, [user])

    const { token } = user || {}

    const hasFocus = useRecoilValue(focusState)

    useEffect(() => {
        hasFocus && !!token && isTokenExpired(token) && refreshToken()
    }, [hasFocus, token])

    const socket = useMemo(() => {
        return !!token && io(process.env.REACT_APP_BE_DOMAIN!, { transports: ['websocket'], auth: { token } })
    }, [token])


    const archiveMessage = useArchiveMessage(privateKey)

    const handleMessageStatus = useMessageStatus()

    useEffect(() => {
        if (!socket) return

        const handleArchiveMessage = (message: ReceivedMessage, ack: Function) => {
            try {
                archiveMessage(message, { showToast: true })
                ack(JSON.stringify({ "hash": message.hash }))
            } catch (error) {
                ack(JSON.stringify({ error: (error as Error).message }))
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
        socket.on('jwt-expired', handleRefreshToken)

        return () => {
            socket.off('in-msg', handleArchiveMessage)
            socket.off('msg-status', handleMessageStatus)
            socket.off('dequeue', handleDequeue)
            socket.off('jwt-expired', handleRefreshToken)
        }

    }, [socket, archiveMessage, handleMessageStatus])

    return socket
}