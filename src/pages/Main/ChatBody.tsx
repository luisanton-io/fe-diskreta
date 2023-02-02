import { focusState } from "atoms/focus"
import { userState } from "atoms/user"
import { useEffect } from "react"
import { useRecoilValue } from "recoil"
import { Socket } from "socket.io-client"
import useMessageStatus from "./handlers/useMessageStatus"
import Message from "./Message"

interface ChatBodyProps {
    socket: false | Socket
    activeChat: Chat
}

export default function ChatBody({ socket, activeChat }: ChatBodyProps) {
    const user = useRecoilValue(userState)
    const handleMessageStatus = useMessageStatus()

    const hasFocus = useRecoilValue(focusState)

    useEffect(() => {
        const newMessages = !!activeChat && [...(activeChat.messages || [])]
            .reverse().filter(msg =>
                msg.sender._id !== user?._id && msg.status === 'new'
            ) as ReceivedMessage[]

        if (hasFocus && socket && user?._id && newMessages && newMessages.length) {
            // emit "read" for new messages
            newMessages.forEach(msg => {
                handleMessageStatus({
                    chatId: activeChat.id,
                    hash: msg.hash,
                    status: 'read',
                    recipientId: user._id
                })

                socket.emit("read-msg", msg)
            })
        }
    }, [hasFocus, socket, user?._id, activeChat, handleMessageStatus])


    return <div id="message-container" className="d-flex flex-column-reverse flex-grow-1 px-2 pb-2" style={{ overflow: 'auto' }}>
        {
            activeChat.messages.map((message, i) => (
                <Message i={i} sent={message.sender._id === user!._id} message={message} key={`msg-${i}`} />
            )).reverse()
        }
    </div>
}