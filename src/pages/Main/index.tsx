import { chatsState } from "atoms/chats";
import { dialogState } from "atoms/dialog";
import { userState } from "atoms/user";
import Diskreta from "components/Diskreta";
import { USER_DIGEST } from "constants/localStorage";
import { pki } from "node-forge";
import { useEffect, useMemo, useState } from "react";
import { Button, Col, Container, Form, ListGroup, Row } from "react-bootstrap";
import { Arrow90degUp, Plus, Trash3 } from "react-bootstrap-icons";
import { useNavigate, useParams } from "react-router-dom";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import io from "socket.io-client";
import useHandleArchiveMessage from "./handlers/useHandleArchiveMessage";
import useHandleSendMessage from "./handlers/useHandleSendMessage";
import UserDialog from "./UserDialog";

export default function Main() {

    const navigate = useNavigate()

    const [chats, setChats] = useRecoilState(chatsState)
    const setDialog = useSetRecoilState(dialogState)
    const user = useRecoilValue(userState)

    const privateKey = useMemo(() => user && pki.privateKeyFromPem(user.privateKey), [user])

    const { activeChat } = useParams()

    const [text, setText] = useState('')

    const socket = useMemo(() => {
        const socket = user && io(process.env.REACT_APP_BE_DOMAIN!, { transports: ['websocket'], auth: { token: user.token } })
        // console.log({ socket })
        return socket
    }, [user])

    const handleArchiveMessage = useHandleArchiveMessage(privateKey)

    useEffect(() => {
        if (!socket) return

        socket.on('in-msg', handleArchiveMessage)

        socket.on('dequeue', (messages: Message[]) => {
            messages.forEach(handleArchiveMessage)
        })

    }, [socket, handleArchiveMessage])

    const recipients = !!chats && !!activeChat && chats[activeChat]?.members?.filter(m => m._id !== user?._id)


    const handleSendMessage = useHandleSendMessage(socket, recipients, activeChat)

    const handleShowSearchModal = () => {
        setDialog({
            Content: UserDialog,
            onConfirm: () => setDialog(null),
            submitLabel: "Search"
        })
    }

    const handleDeleteChat = (id: string) => {
        if (window.confirm("Are you sure you want to delete this chat?")) {
            const _chats = { ...chats }
            delete _chats![id]
            setChats({ ..._chats })
        }
    }

    const userExists = !!user

    useEffect(() => {
        if (!userExists) {
            !localStorage.getItem(USER_DIGEST)
                ? navigate("/register")
                : navigate("/login")
        }
    }, [userExists, navigate])

    console.log(chats, activeChat)

    return <Container>
        <Row style={{ height: '90vh', margin: 'auto' }}>
            <Col xs={4} className="position-relative d-flex flex-column h-100" style={{ overflow: 'auto' }}>
                <Button variant="outline-secondary" className="rounded-0 d-flex align-items-center justify-content-center mt-3 text-white font-monospace" onClick={handleShowSearchModal}>
                    {/* New Chat */}
                    <Plus style={{ fontSize: '1.5em' }} />
                    <span>New</span>
                </Button>
                <hr />
                <ListGroup id="conversations">

                    {
                        chats && Object.values(chats).map(chat => {
                            console.log("CHAT", { chat })
                            const recipients = chat.members.filter(m => m._id !== user?._id).map(r => r.nick).join(', ')
                            const latestMessage = chat.messages[chat.messages.length - 1]
                            // #region
                            // const latestMessage = {
                            //     content: {
                            //         text: "Hello"
                            //     },
                            //     sender: user!._id,
                            //     recipients: chat.members.filter(m => m._id !== user?._id),
                            //     timestamp: Date.now()
                            // }
                            // #endregion
                            return <ListGroup.Item
                                className="conversation"
                                style={{ minHeight: 90 }}
                                key={chat.id}
                                onClick={() => navigate(`/${chat.id}`)}
                                data-active={chat.id === activeChat}
                            >
                                <h6>{recipients}</h6>
                                {latestMessage && (
                                    <div className="d-flex align-items-center">
                                        {latestMessage.sender._id === user!._id && <Arrow90degUp style={{ transform: 'scale(0.6)' }} />}
                                        <span>
                                            {latestMessage.content.text}
                                        </span>
                                    </div>
                                )}
                                <Button variant="outline-danger"
                                    onClick={() => handleDeleteChat(chat.id)}
                                    className="delete-btn position-absolute rounded-0"
                                    style={{ inset: 'auto 1em auto auto' }}>
                                    <Trash3 />
                                </Button>
                            </ListGroup.Item>
                        })
                    }
                </ListGroup>
                {/* <Button variant="outline-danger" className="position-absolute bottom-0 start-0 end-0 rounded-0">
                    Delete data
                </Button> */}
            </Col>
            <Col xs={8} className="d-flex flex-column h-100">
                {
                    chats && activeChat && chats![activeChat]
                        ? <>

                            {recipients && <h4 className="font-monospace">
                                {recipients.map(r => r.nick).join(", ")}
                            </h4>}

                            <hr />

                            <div className="d-flex flex-column-reverse flex-grow-1" style={{ overflow: 'auto' }}>
                                {
                                    chats[activeChat].messages.map((message, i) => {
                                        // const sender =
                                        //     message.sender._id === user!._id
                                        //         ? "You"
                                        //         : chats[activeChat].members.find(m => message.sender._id === m._id)?.nick

                                        return <div key={`msg-${i}`} className={`message ${message.sender._id === user!._id ? "sent" : "received"} p-3 my-2 rounded-0`}>

                                            {/* <strong>{sender}</strong> */}
                                            <span>{message.content.text}</span>
                                            <small>{new Date(message.timestamp).toLocaleTimeString()}</small>
                                        </div>
                                    }).reverse()
                                }
                            </div>


                            <Form onSubmit={handleSendMessage(text, setText)} className="pt-4">
                                <Form.Control id="msg-input" autoComplete="off" className="rounded-0 text-white p-3" type="text" placeholder="Type a message..." onChange={e => setText(e.target.value)} value={text} />
                            </Form>
                        </>
                        :
                        <div className="flex-grow-1 d-flex align-items-center">
                            <Diskreta />
                        </div>

                }
            </Col>
        </Row>
    </Container>
}