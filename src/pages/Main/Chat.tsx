import { chatsState } from "atoms/chats";
import { userState } from "atoms/user";
import Diskreta from "components/Diskreta";
import useSocket from "hooks/useSocket";
import { pki, util } from "node-forge";
import { useState } from "react";
import { Button, Form } from "react-bootstrap";
import { ArrowLeftShort } from "react-bootstrap-icons";
import { Link, useParams } from "react-router-dom";
import { useRecoilState, useRecoilValue } from "recoil";
import maskUser from "util/maskUser";
import Message from "./Message";


export default function Chat() {

    const { activeChat } = useParams()

    const [chats, setChats] = useRecoilState(chatsState)
    const user = useRecoilValue(userState)

    const [text, setText] = useState('')

    const socket = useSocket()

    const recipients = !!chats && !!activeChat && chats[activeChat]?.members?.filter(m => m._id !== user?._id)

    const handleSendMessage = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        if (recipients && socket && activeChat) {
            const message: Message = {
                sender: maskUser(user)!,
                to: recipients,
                chatId: activeChat,
                content: { text },
                timestamp: Date.now()
            }

            setChats(chats => ({
                ...chats,
                [activeChat]: {
                    ...chats![activeChat],
                    messages: [
                        ...chats![activeChat].messages,
                        message
                    ]
                }
            }))

            for (const recipient of recipients) {

                const publicKey = pki.publicKeyFromPem(recipient.publicKey)

                socket.emit("out-msg", {
                    ...message,
                    recipients: [recipient],
                    content: {
                        text: util.encode64(publicKey.encrypt(text))
                    }
                })
            }

            setText('')

        }
    }

    return <>{
        chats && activeChat && chats![activeChat]
            ? <>
                <div className="d-flex align-items-center">
                    <Link to="/" className="d-md-none d-inline-block text-white me-2"><ArrowLeftShort style={{ fontSize: '2em' }} /></Link>
                    {recipients && <h4 className="d-inline-block font-monospace m-0">
                        {recipients.map(r => r.nick).join(", ")}
                    </h4>}
                </div>

                <hr />

                <div id="message-container" className="d-flex flex-column-reverse flex-grow-1 px-2 pb-2" style={{ overflow: 'auto' }}>
                    {
                        chats[activeChat].messages.map((message, i) => (
                            <Message i={i} sent={message.sender._id === user!._id} message={message} key={`msg-${i}`} />
                        )).reverse()
                    }
                </div>


                <Form onSubmit={handleSendMessage} className="pt-3">
                    <Form.Control id="msg-input" autoComplete="off" className="rounded-0 text-white p-3" type="text" placeholder="Type a message..." onChange={e => setText(e.target.value)} value={text} />
                </Form>
            </>
            :
            <div className="flex-grow-1 d-flex align-items-center">
                <Diskreta />
            </div>

    }
    </>
}