import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Col, Container, Form, ListGroup, Row, Spinner } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import io from "socket.io-client";
import { userState } from "../../atoms/user";
import { chatsState } from "../../atoms/chats";
import { dialogState } from "../../atoms/dialog";
import createChatId from "../../util/createChatId";
import { Arrow90degUp, Moon, Send, Sun, Trash3 } from "react-bootstrap-icons";
import Diskreta from "../../components/Diskreta";
import { pki, util } from "node-forge";
import { USER_DIGEST } from "../../constants";

export default function UserDialog() {
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

        const exists = !!chats?.[chatId]

        if (!exists) {
            const publicUser = structuredClone(user) as User & Partial<LoggedUser>

            delete publicUser.digest
            delete publicUser.privateKey
            delete publicUser.token

            setChats(chats => ({
                ...chats,
                [chatId]: {
                    id: chatId,
                    messages: [],
                    members: [publicUser!, selectedUser]
                }
            }))
        }

        navigate("/" + chatId)
        setDialog(null)

    }


    return <Container id="user-dialog">
        <Row>
            <Col className="p-5">
                <h2 className="font-monospace mb-4">Search users</h2>

                <hr />

                <Form className="d-flex position-relative my-5" onSubmit={e => { e.preventDefault() }}>
                    <Form.Control
                        placeholder="Nickname..."
                        className="rounded-0 border-3 font-monospace"
                        type="text"
                        value={query}
                        onChange={e => { setQuery(e.target.value) }} />
                    {
                        (loading) &&
                        <div className="position-absolute" style={{ inset: '0.2em 0.7ch 0.1em auto', transform: 'scale(0.65)' }}>
                            <Spinner animation="border" variant="light" />
                        </div>

                    }
                </Form>

                <ListGroup >
                    {users.map((u, i) =>
                        <ListGroup.Item key={`user-${i}`} style={{ borderColor: 'white' }} className="user-result rounded-0 mb-3 py-3 cursor-pointer text-white border-1" onClick={() => handleSelectedUser(u)}>
                            {u.nick}
                        </ListGroup.Item>
                    )}
                </ListGroup>
            </Col>
        </Row>
    </Container >
}