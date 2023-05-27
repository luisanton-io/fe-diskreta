import { focusState } from "atoms/focus"
import { userState } from "atoms/user"
import { useContext, useEffect } from "react"
import { useRecoilValue } from "recoil"
import { ChatContext } from "./context/ChatCtx"
import useMessageStatus from "../handlers/useMessageStatus"
import Message from "./Message"
import FloatingDate from "./FloatingDate"

export default function ChatBody() {
    const hasFocus = useRecoilValue(focusState)
    const user = useRecoilValue(userState)

    const handleMessageStatus = useMessageStatus()

    const { activeChat, socket, connected } = useContext(ChatContext)

    useEffect(() => {
        const newMessages = !!activeChat && [...(activeChat.messages || [])]
            .reverse().filter(msg =>
                msg.sender._id !== user?._id && msg.status === 'new'
            ) as ReceivedMessage[]

        if (hasFocus && connected && user?._id && newMessages && newMessages.length) {
            // emit "read" for new messages
            newMessages.forEach(msg => {
                handleMessageStatus({
                    chatId: activeChat.id,
                    hash: msg.hash,
                    status: 'read',
                    recipientId: user._id
                })

                socket.emit("read-msg", {
                    ...msg,
                    content: {} // remove decrypted content
                })
            })
        }
    }, [hasFocus, socket, connected, user?._id, activeChat, handleMessageStatus])


    return <div id="message-container" className="d-flex flex-column-reverse flex-grow-1 px-2 pb-2">
        {
            activeChat.messages.map((message, i, messages) => (<>
                {
                    (i === 0 || (new Date(messages[i - 1]?.timestamp).getDay() !== new Date(message.timestamp).getDay())) &&
                    <FloatingDate timestamp={message.timestamp} />
                }
                <Message i={i} sent={message.sender._id === user!._id} message={message} key={`msg-${i}`} />
            </>
            )).reverse()
        }
    </div>
}