import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Col, Container, Form, ListGroup, Row, Spinner } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import io from "socket.io-client";
import { userState } from "../atoms/user";
import { chatsState } from "../atoms/chats";
import { dialogState } from "../atoms/dialog";
import createChatId from "../util/createChatId";
import { Arrow90degUp, Moon, Send, Sun, Trash3 } from "react-bootstrap-icons";
import Diskreta from "../components/Diskreta";
import { pki } from "node-forge";



function UserModal() {
    const navigate = useNavigate()
    const [query, setQuery] = useState("")
    const setDialog = useSetRecoilState(dialogState)

    const timeout = useRef<NodeJS.Timeout>()
    const [debouncedQuery, setDebouncedQuery] = useState("")

    const [users, setUsers] = useState<User[]>([])
    const user = useRecoilValue(userState)
    const [chats, setChats] = useRecoilState(chatsState)

    const [loading, setLoading] = useState(false)
    const [load, unload] = [true, false].map(v => () => setLoading(v))

    useEffect(() => {
        timeout.current && clearTimeout(timeout.current)

        timeout.current = setTimeout(() => {
            setDebouncedQuery(query)
        }, 300)
    }, [query])

    useEffect(() => {
        if (!query) {
            setUsers([])
            unload()
            return
        }

        console.log({ debouncedQuery })

        const getUsers = async () => {
            load()
            setUsers([])
            const response = await fetch(`${process.env.REACT_APP_BE_DOMAIN}/api/users?nick=${query}`)
            return await response.json() as User[]
        }

        getUsers().then(setUsers).finally(unload)
    }, [debouncedQuery])

    const handleSelectedUser = (selectedUser: User) => {
        const chatId = createChatId(user!._id, selectedUser._id)

        console.log("handleselected")
        console.table({ chatId })

        setChats(chats => ({
            ...chats,
            [chatId]: {
                id: chatId,
                messages: [],
                members: [user!, selectedUser]
            }
        }))

        navigate("/" + chatId)
        setDialog(null)

    }


    return <Container>
        <Row>
            <Col className="p-5">
                <h2 className="font-monospace mb-4">Search users</h2>

                <Form className="d-flex position-relative" onSubmit={e => { e.preventDefault() }}>
                    <Form.Control
                        placeholder="Nickname..."
                        className="rounded-0"
                        type="text"
                        value={query}
                        onChange={e => { setQuery(e.target.value) }} />
                    {
                        (loading) &&
                        <div className="position-absolute" style={{ inset: '2px 0 0 auto', transform: 'scale(0.65)' }}>
                            <Spinner animation="border" variant="secondary" />
                        </div>

                    }
                </Form>

                <ListGroup className="mt-3">
                    {users.map((u, i) =>
                        <ListGroup.Item key={`user-${i}`} style={{ cursor: "pointer" }} className="rounded-0" onClick={() => handleSelectedUser(u)}>
                            {u.nick}
                        </ListGroup.Item>
                    )}
                </ListGroup>
            </Col>
        </Row>
    </Container >
}

export default function Main() {

    const navigate = useNavigate()

    const [chats, setChats] = useRecoilState(chatsState)
    const [Dialog, setDialog] = useRecoilState(dialogState)
    const [user, setUser] = useRecoilState(userState)

    const privateKey = useMemo(() => user && pki.privateKeyFromPem(user.privateKey), [user])

    const { activeChat } = useParams()



    const [text, setText] = useState('')

    const showStore = () => {
        console.log(chats)
    }

    const socket = useMemo(() => {
        const socket = user && io(process.env.REACT_APP_BE_DOMAIN!, { transports: ['websocket'], auth: { token: user.token } })
        console.log({ socket })

        return socket
    }, [user])

    // console.log({ socket })

    useEffect(() => {
        if (!socket || !privateKey) return

        const archiveMessage = (encryptedMessage: Message) => {

            console.table({ encryptedMessage })
            const message = {
                ...encryptedMessage,
                content: {
                    text: privateKey.decrypt(encryptedMessage.content.text).toString()
                }
            }

            console.table({ message })

            const { chatId } = message

            if (!chats?.[chatId]) {
                setChats(chats => ({
                    ...chats,
                    [chatId]: {
                        id: chatId,
                        messages: [message],
                        members: [...message.to, message.sender]
                    }
                }))

            } else {

                setChats(chats => ({
                    ...chats,
                    [chatId]: {
                        ...chats![chatId],
                        messages: [
                            ...(chats![chatId].messages || []),
                            message
                        ]
                    }
                }))
            }

        }

        socket.on('in-msg', archiveMessage)

        socket.on('dequeue', (messages: Message[]) => {
            messages.forEach(archiveMessage)
        })

    }, [socket])

    const recipients = chats && activeChat && chats[activeChat]?.members?.filter(m => m._id !== user?._id)


    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        if (recipients) {
            const message: Message = {
                sender: user!,
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

                socket?.emit("out-msg", {
                    ...message,
                    content: {
                        text: publicKey.encrypt(text)
                    }
                })
            }

            setText('')

        }

    }

    const handleShowSearchModal = () => {
        setDialog({
            Content: UserModal,
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


    useEffect(() => {
        if (!user) {
            !localStorage.getItem("_")
                ? navigate("/register")
                : navigate("/login")
        }
    }, [!!user])

    console.log(chats, activeChat)

    return <Container>
        <Row style={{ height: '90vh', margin: 'auto' }}>
            <Col xs={4} className="position-relative d-flex flex-column h-100" style={{ overflow: 'auto' }}>
                <Button variant="outline-secondary" className="rounded-0" onClick={handleShowSearchModal}>New Chat</Button>
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
                                className="conversation position-relative d-flex flex-column align-items-start justify-content-center cursor-pointer rounded-0"
                                style={{ minHeight: 90 }}
                                key={chat.id}
                                onClick={() => navigate(`/${chat.id}`)}
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
                                        const sender =
                                            message.sender._id === user!._id
                                                ? "You"
                                                : chats[activeChat].members.find(m => message.sender._id === m._id)?.nick

                                        return <div key={`msg-${i}`} className={`message ${message.sender._id === user!._id ? "sent" : "received"} d-flex flex-column p-3 my-2 rounded-0`}>

                                            <strong>{sender}</strong>
                                            <span>{message.content.text}</span>
                                            <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
                                        </div>
                                    }).reverse()
                                }
                            </div>


                            <Form onSubmit={handleSubmit}>
                                <Form.Control className="rounded-0" type="text" placeholder="Type a message..." onChange={e => setText(e.target.value)} value={text} />
                                {/* <Form.Control className="rounded-0" type="button" onClick={showStore} value="Show store" /> */}
                                {/* <Form.Control className="rounded-0" type="submit" value="click me" /> */}
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