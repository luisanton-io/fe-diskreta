import { AES, enc, SHA512 } from "crypto-js";
import { pki } from "node-forge";
import { useRef, useState } from "react";
import { Badge, Button, Col, Container, Form, InputGroup, Row } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useRecoilState, useSetRecoilState } from "recoil";
import { dialogState } from "../atoms/dialog";
import { userState } from "../atoms/user";
import { defaultChats, chatsState } from "../atoms/chats";
import generateKeyPair from "../util/generateKeypair";
import Diskreta from "../components/Diskreta";
import { CHATS, USER, USER_DIGEST } from "../constants";

interface DecryptionResult {
    error: Error | null
    chats: Record<string, Chat> | null
    user: LoggedUser
    previousUser: boolean
}

const decryptLocalStorage = (digest: string): DecryptionResult => {

    let error: Error | null = null

    const localKeys = [CHATS, USER] as const

    const [encryptedChats, encryptedUser] = localKeys.map(k => localStorage.getItem(k))

    // Was there anyone here before?
    const previousUser = !!encryptedChats && !!encryptedUser

    let [chats, user] =
        [encryptedChats, encryptedUser]
            .map(cipher => {
                try {
                    return cipher && AES.decrypt(cipher, digest).toString(enc.Utf8)
                } catch {
                    console.log("Error decrypting")
                    console.log(cipher, digest)
                    error = new Error("Error decrypting")
                    return null
                }
            })
            .map((json, i) => json && JSON.parse(json)[localKeys[i]])

    return { error, chats, user, previousUser }

}

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

        if (!nick || !password) {
            return toast.error("Credentials missing")
        }

        try {
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

                // We try to decrypt the store with the current user digest
                const digest = SHA512(nick + password).toString()

                const { error, chats, user, previousUser } = decryptLocalStorage(digest)


                // If decrypt fails we try to decrypt with the previous user digest. 
                // To retrieve it, we need to regenerate the previous user keys

                // User digest is different if:
                // - user changed his password
                // - another user was previously logged in

                if (!chats || !user) {
                    console.log({ previousUser })
                    if (previousUser && !window.confirm("Signing in with a new user will destroy all data associated with any previous user. Continue?")) {
                        return
                    }

                    localStorage.clear()

                    setDialog({
                        submitLabel: "Generate",
                        Content: () => {
                            return (
                                <Form className="p-5">
                                    <p>Welcome to a new device. You need to regenerate your keypair in order to use Diskreta here.</p>
                                    <p>Please note we do not store your messages and you will need to export them from your old device.</p>
                                    <p>This feature is planned for upcoming releases.</p>
                                    <p><strong>If this is not your device,</strong> log out after your session to destroy your data.</p>
                                    <Form.Control type="text" placeholder="Seed" onChange={e => { mnemonic.current = e.target.value }} />
                                </Form>
                            )
                        },
                        onConfirm: async () => {
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
                    const token = pki.privateKeyFromPem(user.privateKey).decrypt(plainToken)

                    setUser({ ...user, token })
                    setChats(chats)
                    navigate("/")
                }


            }

        } catch (error) {
            toast.error((error as Error).message)
        }
    }

    const handleForgotPassword = () => {
        console.log("handleForgotPassword")

        localStorage.clear()

        setDialog({
            submitLabel: "Generate",
            Content: () => {
                return (
                    <Form className="p-5">
                        <p>If you were previously logged in this device, you can recover your data here.</p>
                        <p>You need to regenerate your keypair in order to do so.</p>
                        <strong>Please insert your 24 words mnemonic here separated by white space.</strong>
                        <Form.Control className="d-inline-block rounded-0 my-4" type="text" placeholder="Seed" onChange={e => { mnemonic.current = e.target.value }} />
                    </Form>
                )
            },
            onConfirm: async () => {
                console.log(mnemonic.current)
                toast.promise(new Promise<void>((resolve) => {

                    setTimeout(async () => {
                        const oldDigestEncrypted = localStorage.getItem(USER_DIGEST)

                        if (!oldDigestEncrypted || !window.confirm("No previous user found on this device. Continue?")) {
                            return
                        }

                        const { privateKey } = await generateKeyPair(mnemonic.current)

                        const oldDigest = privateKey.decrypt(oldDigestEncrypted)

                        const { error, chats, user, previousUser } = decryptLocalStorage(oldDigest)

                        if (error) {
                            if (!window.confirm(`
                                Error decrypting previous user data.
                                Press OK if you wish to continue generating the keys with this seed and delete all previous data.
                            `)) {
                                return
                            }
                            else {
                                localStorage.clear()
                                // enter new password........
                                return
                            }
                        }


                        // enter new password, calc new digest.

                        // localStorage.setItem(USER_DIGEST, digest)

                        // PATCH user's "digest" using a non-expiring one-time token (to be saved in users.tokens)

                        // login with new digest and setUser

                        // setUser({
                        //     ...responseUser, // the newly downloaded data from the server
                        //     token: privateKey.decrypt(plainToken),
                        //     privateKey: pki.privateKeyToPem(privateKey),
                        //     digest
                        // })

                        // setChats(chats || defaultChats) // either the old chats or the default if error
                        // navigate("/")

                        resolve()
                    }, 1000)
                }), {
                    pending: "Generating your keys...",
                    error: "Error generating your keys. Please try again.",
                    success: "Your keys have been generated"
                })
            }
        })
    }

    // console.log('hi')

    return <Container>
        <Row className="h-100">
            <Col lg={4} className="mx-auto pt-5 px-5 pb-3 bg-dark">
                <div className="text-white"><Diskreta /></div>
                <h6 className="text-white text-center">Login</h6>

                {/* <div style={{ width: 100, height: 100, backgroundColor: `#${digest.slice(-6)}` }}></div> */}
                <Form className="enter-form d-flex flex-column" onSubmit={handleSubmit}>
                    <Form.Control onChange={e => { setNick(e.target.value) }} value={nick} className="bg-transparent text-white rounded-0 mb-4" type="text" placeholder="Username" />
                    <InputGroup>
                        <Form.Control onChange={e => { setPassword(e.target.value) }} value={password} className="bg-transparent text-white rounded-0 mb-0 me-1" type="password" placeholder="Password" />

                        <InputGroup.Text
                            className="rounded-0 btn btn-outline-secondary forgot"
                            style={{ borderWidth: 3 }}
                            onClick={handleForgotPassword}
                        >
                            Forgot?
                        </InputGroup.Text>
                    </InputGroup>
                    {/* <Badge bg="transparent" text="white" onClick={handleForgotPassword} className="cursor-pointer rounded-0 p-2 me-auto my-2" style={{ border: '3px solid white' }}>Forgot password</Badge> */}

                    <Form.Control type="submit"
                        className="btn btn-outline-info ms-auto w-50 my-3 rounded-0 font-monospace login"
                        value="Login"
                        style={{ borderWidth: 3 }}
                    />

                    <Link to="/register" className="text-white my-3">Don't have an account?</Link>

                </Form>
            </Col>
        </Row>
    </Container>
}