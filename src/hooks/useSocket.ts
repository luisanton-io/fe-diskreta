import { refreshToken } from "API/refreshToken"
import { chatsState } from "atoms/chats"
import { userState } from "atoms/user"
import useArchiveMessage from "pages/Main/handlers/useArchiveMessage"
import useMessageStatus from "pages/Main/handlers/useMessageStatus"
import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "react-toastify"
import { useRecoilValue, useSetRecoilState } from "recoil"
import { io } from "socket.io-client"

interface TimeoutMap {
    [key: string]: { // chatid
        [key: string]: NodeJS.Timeout // userid: timeoutRef
    }
}

export default function useSocket() {

    const user = useRecoilValue(userState)

    const { token } = user || {}

    const socket = useMemo(() => {
        return !!token && io(process.env.REACT_APP_BE_DOMAIN!, { transports: ['websocket'], auth: { token } })
    }, [token])

    const [connected, setConnected] = useState(false)

    const archiveMessage = useArchiveMessage()

    const handleMessageStatus = useMessageStatus()

    const setChats = useSetRecoilState(chatsState)
    const typingTimeouts = useRef<TimeoutMap>({})

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
                // console.log(queue)
                messages.forEach(msg => archiveMessage(msg, { showToast: false }))
                status.forEach(msg => handleMessageStatus(msg))
                ack()
            } catch (error) {
                console.log("Handle dequeue error:", error)
                ack((error as Error).message)
            }
        }

        const handleTyping = (typing: TypingMsg) => {


            const currentTimeout = typingTimeouts.current[typing.chatId]?.[typing.sender._id]

            // console.table({ currentTimeout: !!currentTimeout })
            // console.log(typingTimeouts.current)

            if (currentTimeout) {
                clearTimeout(currentTimeout)
                delete typingTimeouts.current[typing.chatId]![typing.sender._id]
            } else {
                setChats(chats => !chats?.[typing.chatId] ? chats : {
                    ...chats,
                    [typing.chatId]: {
                        ...chats[typing.chatId],
                        typing: [...(chats[typing.chatId]?.typing || []), typing.sender._id]
                    }
                })
            }

            (typingTimeouts.current[typing.chatId] ||= {})[typing.sender._id] = setTimeout(() => {
                delete typingTimeouts.current[typing.chatId]![typing.sender._id]
                setChats(chats => chats && {
                    ...chats,
                    [typing.chatId]: {
                        ...chats[typing.chatId],
                        typing: chats[typing.chatId].typing?.filter(id => id !== typing.sender._id)
                    }
                })
            }, 500)

        }

        const handleRefreshToken = () => {
            socket.disconnect()
            refreshToken()
        }

        const onDisconnect = () => {
            toast.info("Connecting...", { position: toast.POSITION.TOP_CENTER, autoClose: false })
            setChats(chats => chats && Object.values(chats).reduce((chats, { id }) => ({
                ...chats,
                [id]: {
                    ...chats[id],
                    typing: undefined
                }
            }), chats))
            refreshToken()
            setConnected(false)
        }

        const onConnect = () => {
            toast.dismiss()
            toast.success("Connected!", { position: toast.POSITION.TOP_CENTER, autoClose: 2000 })
            setConnected(true)
        }

        socket.on('in-msg', handleArchiveMessage)
        socket.on('msg-status', handleMessageStatus)
        socket.on('dequeue', handleDequeue)
        socket.on('typing', handleTyping)
        socket.on('connect', onConnect)
        socket.on('disconnect', onDisconnect)
        socket.on('connect_error', handleRefreshToken);

        return () => {
            socket.off('in-msg', handleArchiveMessage)
            socket.off('msg-status', handleMessageStatus)
            socket.off('dequeue', handleDequeue)
            socket.off('typing', handleTyping)
            socket.off('connect', onConnect)
            socket.off('disconnect', onDisconnect)
            socket.off('connect_error', handleRefreshToken);
        }

    }, [socket, archiveMessage, handleMessageStatus, setChats])

    return { socket, connected }
}