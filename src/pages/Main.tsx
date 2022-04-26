import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Col, Container, Form, ListGroup, Row, Spinner } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import io from "socket.io-client";
import { userState } from "../atoms/user";
import { chatsState } from "../atoms/chats";
import { dialogState } from "../atoms/dialog";
import createChatId from "../util/createChatId";
import { Arrow90degUp, Moon, Send, Sun } from "react-bootstrap-icons";
import Diskreta from "../components/Diskreta";



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

                <Form className="d-flex position-relative">
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
    </Container>
}

export default function Main() {

    const navigate = useNavigate()

    const [chats, setChats] = useRecoilState(chatsState)
    const [Dialog, setDialog] = useRecoilState(dialogState)
    const [user, setUser] = useRecoilState(userState)

    const { activeChat } = useParams()



    const [message, setMessage] = useState('')

    const showStore = () => {
        console.log(chats)
    }

    const socket = useMemo(() => user && io(process.env.REACT_APP_BE_DOMAIN!, { transports: ['websocket'], auth: { token: user.token } }), [user])

    useEffect(() => {
        if (!socket) return

        socket.on('in-msg', (message: Message) => {
            console.log(message)
        })

        socket.on('dequeue', (messages: Message[]) => {
            console.log(messages)
        })

    }, [socket])
    console.log(user)

    const recipients = chats && activeChat && chats[activeChat]?.members.filter(m => m._id !== user?._id)


    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        if (recipients) {

            setChats(chats => ({
                ...chats,
                [activeChat]: {
                    ...chats![activeChat],
                    messages: [
                        ...chats![activeChat].messages,
                        {
                            sender: user!._id,
                            to: recipients.map(r => r._id),
                            chatId: activeChat,
                            content: {
                                text: message
                            },
                            timestamp: Date.now()
                        }
                    ]
                }
            }))

            socket?.emit("out-msg", message)

        }

    }

    const handleShowSearchModal = () => {
        setDialog({
            Content: UserModal,
            onClose: () => setDialog(null),
            submitLabel: "Search"
        })
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
            <Col xs={4} className="d-flex flex-column">
                <Button variant="outline-secondary" className="rounded-0" onClick={handleShowSearchModal}>New Chat</Button>
                <hr />
                <ListGroup>

                    {
                        chats && Object.values(chats).map(chat => {
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
                                className="cursor-pointer rounded-0 d-flex align-items-center"
                                style={{ minHeight: 90 }}
                                key={chat.id}
                                onClick={() => navigate(`/${chat.id}`)}
                            >
                                <h6>{recipients}</h6>
                                {latestMessage && (
                                    <div className="d-flex align-items-center">
                                        {latestMessage.sender === user!._id && <Arrow90degUp style={{ transform: 'scale(0.6)' }} />}
                                        <span>
                                            {latestMessage.content.text}
                                        </span>
                                    </div>
                                )}
                            </ListGroup.Item>
                        })
                    }
                </ListGroup>
            </Col>
            <Col xs={8} className="d-flex flex-column">
                {
                    chats && activeChat && chats![activeChat]
                        ? <>

                            {recipients && <h4 className="font-monospace">
                                {recipients.map(r => r.nick).join(", ")}
                            </h4>}

                            <hr />

                            <div className="d-flex flex-column flex-grow-1">
                                {
                                    chats[activeChat].messages.map((message, i) => {
                                        const sender =
                                            message.sender === user!._id
                                                ? "You"
                                                : chats[activeChat].members.find(m => message.to.includes(m._id))!.nick

                                        return <div key={`msg-${i}`} className="d-flex align-items-center">
                                            <span>{sender}</span>
                                            <span>{message.content.text}</span>
                                        </div>
                                    })
                                }
                            </div>


                            <Form onSubmit={handleSubmit}>
                                <Form.Control className="rounded-0" type="text" placeholder="Type a message..." onChange={e => setMessage(e.target.value)} />
                                <Form.Control className="rounded-0" type="button" onClick={showStore} value="Show store" />
                                <Form.Control className="rounded-0" type="submit" value="click me" />
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