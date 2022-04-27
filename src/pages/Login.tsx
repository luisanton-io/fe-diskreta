import { AES, enc, SHA512 } from "crypto-js";
import { pki } from "node-forge";
import { useRef, useState } from "react";
import { Col, Container, Form, Row } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useRecoilState, useSetRecoilState } from "recoil";
import { dialogState } from "../atoms/dialog";
import { userState } from "../atoms/user";
import { defaultChats, chatsState } from "../atoms/chats";
import generateKeyPair from "../util/generateKeypair";
import Diskreta from "../components/Diskreta";

export default function Login() {

    const navigate = useNavigate()

    const [nick, setNick] = useState("");
    const [password, setPassword] = useState("");

    const setUser = useSetRecoilState(userState)
    const setChats = useSetRecoilState(chatsState)
    const [Dialog, setDialog] = useRecoilState(dialogState)

    const mnemonic = useRef("")

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        const response = await fetch(`${process.env.REACT_APP_BE_DOMAIN}/api/users/session`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ nick, password })
        })

        if (!response.ok) {
            toast.error("Wrong credentials!")
        } else {
            const { token: plainToken, user: responseUser } = await response.json() as LoginResponse

            const [encryptedStore, encryptedUser] = ['_', 'user'].map(k => localStorage.getItem(k))

            // Was there anyone here before?

            const previousUser = !!encryptedStore && !!encryptedUser

            // We try to decrypt the store with the current user digest
            const digest = SHA512(nick + password).toString()

            let [store, user] =
                [encryptedStore, encryptedUser]
                    .map(cipher => {
                        try {
                            return cipher && AES.decrypt(cipher, digest).toString(enc.Utf8)
                        } catch {
                            console.log("Error decrypting")
                            console.log(cipher, digest)
                            // debugger;
                            return null
                        }
                    })
                    .map((json, i) => json && JSON.parse(json)[['chats', 'user'][i]])


            // If decrypt fails we try to decrypt with the previous user digest. 
            // To retrieve it, we need to regenerate the previous user keys

            // User digest is different if:
            // - user changed his password
            // - another user was previously logged in

            if (!store || !user) {
                console.log({ previousUser })
                if (previousUser && !window.confirm("Signing in with a new user will destroy all data associated with any previous user. Continue?")) {
                    return
                }

                localStorage.clear()

                setDialog({
                    submitLabel: "Generate",
                    Content: () => {
                        return (
                            <Form>
                                <p>Welcome to a new device. You need to regenerate your keypair in order to use Diskreta here.</p>
                                <p>Please note we do not store your messages and you will need to export them from your old device.</p>
                                <p>This feature is planned for upcoming releases.</p>
                                <p><strong>If this is not your device,</strong> log out after your session to destroy your data.</p>
                                <Form.Control type="text" placeholder="Seed" onChange={e => { mnemonic.current = e.target.value }} />
                            </Form>
                        )
                    },
                    onClose: async () => {
                        toast.promise(new Promise<void>((resolve) => {
                            setTimeout(async () => {
                                const { privateKey } = await generateKeyPair(mnemonic.current)
                                const digest = SHA512(nick + password).toString()

                                setUser({
                                    ...responseUser,
                                    token: privateKey.decrypt(plainToken),
                                    privateKey: pki.privateKeyToPem(privateKey),
                                    digest
                                })
                                setChats(defaultChats)
                                navigate("/")

                                resolve()
                            }, 1000)
                        }), {
                            pending: "Generating your keys...",
                            error: "Error generating your keys. Please try again.",
                            success: "Your keys have been generated"
                        })
                    }
                })

            } else {
                console.log("logged in...")
                console.log(user);

                (window as any).tempuser = user
                const token = pki.privateKeyFromPem(user.privateKey).decrypt(plainToken)

                setUser({ ...user, token })
                setChats(store)
                navigate("/")
            }


        }
    }

    // console.log('hi')

    return <Container>
        <Row className="h-100">
            <Col lg={4} className="mx-auto p-5 bg-secondary">
                <div className="text-white"><Diskreta /></div>
                <h6 className="text-white text-center">Login</h6>

                {/* <div style={{ width: 100, height: 100, backgroundColor: `#${digest.slice(-6)}` }}></div> */}
                <Form className="d-flex flex-column" onSubmit={handleSubmit}>
                    <Form.Control onChange={e => { setNick(e.target.value) }} value={nick} className="rounded-0 mb-4" type="text" placeholder="Username" />
                    <Form.Control onChange={e => { setPassword(e.target.value) }} value={password} className="rounded-0 mb-4" type="password" placeholder="Password" />

                    <Form.Control type="submit" className="ms-auto w-50 rounded-0" value="LOGIN" />

                    <Link to="/register" className="text-white">Don't have an account?</Link>
                </Form>
            </Col>
        </Row>
    </Container>
}