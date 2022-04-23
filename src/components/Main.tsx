import { AES, enc } from "crypto-js";
import { useEffect, useState } from "react";
import { Col, Container, Form, Row } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useRecoilState } from "recoil";
import { storeState } from "../atoms/store";
import { userState } from "../atoms/user"

export default function Main() {

    const navigate = useNavigate()

    const [store, setStore] = useRecoilState(storeState)
    const [user, setUser] = useRecoilState(userState)

    const [message, setMessage] = useState('')

    const showStore = () => {
        console.log(store)
    }

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setStore(s => s && ({
            ...s,
            chats: {
                ...s.chats,
                'TEST_CHAT': {
                    ...(s.chats.TEST_CHAT || {}),
                    messages: [
                        ...(s.chats.TEST_CHAT?.messages || []),
                        {
                            sender: "USERID",
                            recipients: [{
                                id: "USERID",
                                pubkey: "PUBKEY",
                                username: "USERNAME"
                            }],
                            chatId: "CHATID",
                            content: {
                                text: message
                            },
                            timestamp: Date.now()
                        }
                    ]
                }
            }
        }))

    }

    useEffect(() => {
        if (!user) navigate("/login")
        else if (!store) {
            if (localStorage.getItem('_')) try {
                const { store: restored } = JSON.parse(AES.decrypt(localStorage.getItem('_')!, user.id).toString(enc.Utf8))
                setStore(restored)
                return
            } catch { } // decryption failure falls through to set default store

            setStore({
                chats: {},
                active: null
            })
        }
    }, [user])

    return <Container>
        <Row>
            <Col>
                <Form onSubmit={handleSubmit}>
                    <Form.Control type="text" placeholder="test" onChange={e => setMessage(e.target.value)} />
                    <Form.Control type="button" onClick={showStore} value="Show store" />
                    <Form.Control type="submit" value="click me" />
                </Form>
            </Col>
        </Row>
    </Container>
}