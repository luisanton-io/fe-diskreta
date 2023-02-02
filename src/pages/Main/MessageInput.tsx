import { chatsState } from "atoms/chats";
import { userState } from "atoms/user";
import { SHA256 } from "crypto-js";
import useActiveChat from "hooks/useActiveChat";
import { pki, util } from "node-forge";
import { useContext, useState } from "react";
import { Button, Form } from "react-bootstrap";
import { Send } from "react-bootstrap-icons";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { Socket } from "socket.io-client";
import maskUser from "util/maskUser";
import { ChatContext } from "./context/ChatCtx";
import useMessageStatus from "./handlers/useMessageStatus";

export default function MessageInput() {
    const setChats = useSetRecoilState(chatsState)
    const user = useRecoilValue(userState)

    const handleMessageStatus = useMessageStatus()

    const { socket, recipients } = useContext(ChatContext)

    const [text, setText] = useState('')
    const { activeChatId } = useActiveChat()

    const handleSendMessage = (e: React.FormEvent<HTMLFormElement> | React.KeyboardEvent<HTMLTextAreaElement>) => {
        e.preventDefault()

        if (socket && activeChatId && recipients && text) {
            const payload: Omit<SentMessage, "hash" | "status"> = {
                sender: maskUser(user)!,
                to: recipients,
                chatId: activeChatId,
                content: { text },
                timestamp: Date.now()
            }

            const message = {
                ...payload,
                hash: SHA256(JSON.stringify(payload)).toString(),
            }

            const sentMessage: SentMessage = {
                ...message,
                status: recipients.reduce((all, { _id }) => ({
                    ...all,
                    [_id]: 'outgoing'
                }), {})
            }

            setChats(chats => ({
                ...chats,
                [activeChatId]: {
                    ...chats![activeChatId],
                    messages: [
                        ...chats![activeChatId].messages,
                        sentMessage
                    ]
                }
            }))

            for (const recipient of recipients) {

                const publicKey = pki.publicKeyFromPem(recipient.publicKey)

                const outgoingMessage: OutgoingMessage = {
                    ...message,
                    to: recipients,
                    for: recipient._id,
                    content: {
                        text: util.encode64(publicKey.encrypt(util.encodeUtf8(text)))
                    }
                }

                delete outgoingMessage.sender

                socket.emit("out-msg", outgoingMessage, (recipientId: string) => {
                    handleMessageStatus({
                        chatId: activeChatId,
                        hash: message.hash,
                        recipientId,
                        status: 'sent'
                    })
                })
            }

            setText('')
        }
    }

    return <Form onSubmit={handleSendMessage} className="d-flex pt-3">
        <textarea id="msg-input" autoComplete="off"
            className="rounded-0 text-white p-3 bg-transparent flex-grow-1 border-light"
            placeholder="Type a message..."
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage(e)}
        />
        <Button type="submit" className="btn-submit ms-2" variant="outline-info" disabled={!text}>
            <Send />
        </Button>
    </Form>
}