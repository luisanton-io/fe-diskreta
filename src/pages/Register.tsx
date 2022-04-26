import { generateMnemonic } from "bip39";
import { SHA512 } from "crypto-js";
import { pki } from "node-forge";
import { useEffect, useState } from "react";
import { Col, Container, Form, InputGroup, Row } from "react-bootstrap";
import { Eye, EyeSlash } from "react-bootstrap-icons";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useRecoilState, useSetRecoilState } from "recoil";
import { dialogState } from "../atoms/dialog";
import { userState } from "../atoms/user";
import Diskreta from "../components/Diskreta";
import generateKeyPair from "../util/generateKeypair";

function SeedDialog({ seed }: { seed: string }) {
    return <Container>
        <Row>
            <Col className="p-5">
                <h2>Do not screenshot this,</h2>
                <h2>do not copy paste this.</h2>
                <h6 className="my-4">We will only display the following seed once. <br /> Please make sure to write it down on paper and store it somewhere safe to recover your account and decrypt the message history if you forget your password.</h6>
                <Row>
                    <Col xs={6}>
                        <ol>
                            {seed.split(' ').slice(0, 12).map((word, i) => <li key={`li-${i}`}>{word}</li>)}
                        </ol>
                    </Col>
                    <Col xs={6}>
                        <ol start={13}>
                            {seed.split(' ').slice(12).map((word, i) => <li key={`li-${i + 12}`}>{word}</li>)}
                        </ol>
                    </Col>
                </Row>

            </Col>
        </Row>
    </Container>
}

export default function Register() {

    const navigate = useNavigate()

    const setUser = useSetRecoilState(userState)
    const [dialog, setDialog] = useRecoilState(dialogState)

    const [nick, setNick] = useState('')
    const [password, setPassword] = useState('')
    const [showPwd, setShowPwd] = useState(false)

    // useEffect(() => {
    //     if (localStorage.getItem('_')) {
    //         navigate('/login')
    //     }
    // }, [])



    const handleToggleShowPwd = () => {
        setShowPwd(s => !s)
    }

    // useEffect(() => {
    //     if (localStorage.getItem('_')
    //         && !window.confirm("You previously logged in with another user on this device. Continuing will destroy all data associated with the previous user. Continue?")) {
    //         return navigate("/login")
    //     }
    // }, [])


    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        console.log("Submit")

        const mnemonic = generateMnemonic(256)
        setDialog({
            Content: () => { return <SeedDialog seed={mnemonic} /> },
            onClose: () => {

                toast.promise(new Promise<void>((resolve) => {
                    setTimeout(async () => {
                        await handleContinue(mnemonic)

                        resolve()
                    }, 1000)

                }), {
                    pending: "Generating your keys...",
                    error: "Error generating your keys. Please try again.",
                    success: "Your keys have been generated"
                })

            },
            submitLabel: "Continue"
        })
    }

    const handleContinue = async (mnemonic: string) => {

        const { privateKey, publicKey } = await generateKeyPair(mnemonic)
        const digest = SHA512(nick + password).toString()

        localStorage.setItem('digest', publicKey.encrypt(digest))

        const response = await fetch(`${process.env.REACT_APP_BE_DOMAIN}/api/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ password, nick, publicKey: pki.publicKeyToPem(publicKey) })
        })

        if (response.ok) {
            const { token: plainToken, user } = await response.json() as LoginResponse

            const token = privateKey.decrypt(plainToken)

            const newUserState = {
                ...user,
                digest,
                token,
                privateKey: pki.privateKeyToPem(privateKey)
            }

            console.log(newUserState)

            setUser(newUserState)
            navigate("/")
        }
    }

    return <Container>
        <Row>
            <Col lg={4} className="mx-auto p-5 bg-secondary">
                <Diskreta />
                <h6 className="text-white text-center">Register</h6>

                <Form onSubmit={handleSubmit}>
                    <Form.Control
                        type="text"
                        className="rounded-0 mb-2"
                        value={nick}
                        onChange={e => setNick(e.target.value)}
                        placeholder="Nickname"
                        required
                    />

                    <InputGroup className="mb-5 rounded-0">

                        <Form.Control
                            required
                            className="rounded-0"
                            type={showPwd ? "text" : "password"}
                            onChange={e => setPassword(e.target.value)}
                            value={password}
                            placeholder="Password"
                        />

                        <InputGroup.Text
                            className="rounded-0"
                            onClick={handleToggleShowPwd}
                            style={{ cursor: "pointer" }}
                        >
                            {
                                showPwd
                                    ? <Eye />
                                    : <EyeSlash />
                            }
                        </InputGroup.Text>
                    </InputGroup>

                    <Form.Control className="rounded-0 mb-2" type="submit" value="Register" />

                    <Link className="text-white" to={'/login'}>Already have an account?</Link>
                </Form>
            </Col>
        </Row>
    </Container>
}