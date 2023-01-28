import { chatsState } from "atoms/chats";
import { focusState } from "atoms/focus";
import { userState } from "atoms/user";
import Diskreta from "components/Diskreta";
import { SHA256 } from "crypto-js";
import useSocket from "hooks/useSocket";
import { pki, util } from "node-forge";
import { useEffect, useState } from "react";
import { Button, Col, Dropdown, Form } from "react-bootstrap";
import { ArrowLeftShort, Send, ThreeDots } from "react-bootstrap-icons";
import { JSONTree } from "react-json-tree";
import { Link, useParams } from "react-router-dom";
import { useRecoilState, useRecoilValue } from "recoil";
import maskUser from "util/maskUser";
import useHandleDeleteChat from "./handlers/useHandleDeleteChat";
import useMessageStatus from "./handlers/useMessageStatus";
import Message from "./Message";

export interface SocketEcho {
    event: string
    payload: Record<string, any>
}

export default function Chat() {

    const { activeChat } = useParams()

    const [chats, setChats] = useRecoilState(chatsState)
    const user = useRecoilValue(userState)

    const [serverView, setServerView] = useState(true)
    const [serverEcho, setServerEcho] = useState<SocketEcho[]>([])

    const [text, setText] = useState('')

    const socket = useSocket(setServerEcho)
    const handleDeleteChat = useHandleDeleteChat()
    const handleMessageStatus = useMessageStatus()

    useEffect(() => {
        setServerEcho([])
    }, [activeChat])

    const hasFocus = useRecoilValue(focusState)

    useEffect(() => {
        const newMessages = !!activeChat && [...(chats?.[activeChat].messages || [])].reverse().filter(msg => msg.sender._id !== user?._id && msg.status === 'new') as ReceivedMessage[]

        if (hasFocus && socket && user?._id && activeChat && newMessages && newMessages.length) {
            // emit "read" for new messages
            newMessages.forEach(msg => {
                handleMessageStatus({
                    chatId: activeChat,
                    hash: msg.hash,
                    status: 'read',
                    recipientId: user._id
                })

                socket.emit("read-msg", msg)
            })
        }
    }, [hasFocus, socket, user?._id, chats, activeChat, handleMessageStatus])

    const recipients = !!activeChat && chats?.[activeChat]?.members?.filter(m => m._id !== user?._id)


    const handleSendMessage = (e: React.FormEvent<HTMLFormElement> | React.KeyboardEvent<HTMLTextAreaElement>) => {
        e.preventDefault()

        if (socket && activeChat && recipients && text) {
            const payload: Omit<SentMessage, "hash" | "status"> = {
                sender: maskUser(user)!,
                to: recipients,
                chatId: activeChat,
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
                [activeChat]: {
                    ...chats![activeChat],
                    messages: [
                        ...chats![activeChat].messages,
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
                        chatId: activeChat,
                        hash: message.hash,
                        recipientId,
                        status: 'sent'
                    })
                })

                setText('')

            }
        }
    }

    return <>{
        chats && activeChat && chats![activeChat]
            ? <div className="d-flex flex-column h-100">
                <div id="server-echo"
                    data-server-view={serverView}
                >
                    <Button variant="outline-warning" style={{ height: 42 }} className="btn-submit" onClick={() => { setServerView(v => !v) }}> {serverView ? "Hide" : "Show"} server logs</Button>
                    {
                        serverView &&
                        <JSONTree data={serverEcho.length ? serverEcho : { message: "No activity detected." }} hideRoot />
                    }
                </div>
                <div className="d-flex flex-column flex-grow-1" style={{ minHeight: '45vh' }}>
                    <div className="d-flex align-items-center mt-3">
                        <Link to="/" className="d-md-none d-inline-block text-white me-2"><ArrowLeftShort style={{ fontSize: '2em' }} /></Link>
                        {recipients && <h4 className="d-inline-block font-monospace m-0">
                            {recipients.map(r => r.nick).join(", ")}
                        </h4>}

                        <Dropdown className="ms-auto">
                            <Dropdown.Toggle variant="link" className="rounded-0 text-white border-0 shadow-none">
                                <ThreeDots style={{ fontSize: '1.5em' }} />
                            </Dropdown.Toggle>

                            <Dropdown.Menu style={{ backdropFilter: "blur(8px)", backgroundColor: 'rgba(16,16,16,0.50)' }}>
                                <Dropdown.Item className="bg-transparent text-white">
                                    Block/Report [coming soon]
                                </Dropdown.Item>
                                <Dropdown.Divider />
                                <Dropdown.Item className="bg-transparent text-white" onClick={() => handleDeleteChat(activeChat)}>Delete Chat</Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                    </div>

                    <hr />

                    <div id="message-container" className="d-flex flex-column-reverse flex-grow-1 px-2 pb-2" style={{ overflow: 'auto' }}>
                        {
                            chats[activeChat].messages.map((message, i) => (
                                <Message i={i} sent={message.sender._id === user!._id} message={message} key={`msg-${i}`} />
                            )).reverse()
                        }
                    </div>


                    <Form onSubmit={handleSendMessage} className="d-flex pt-3">
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
                </div>

            </div>
            :
            <Col className="d-flex align-items-center flex-grow-1">
                <Diskreta />
            </Col>

    }
    </>
}