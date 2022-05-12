import { generateMnemonic } from "bip39";
import { SHA512 } from "crypto-js";
import { pki, util } from "node-forge";
import { useEffect, useState } from "react";
import { Button, Col, Container, Form, InputGroup, Row } from "react-bootstrap";
import { Eye, EyeSlash } from "react-bootstrap-icons";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useRecoilState, useSetRecoilState } from "recoil";
import { userState } from "../atoms/user";
import { dialogState } from "../atoms/dialog";
import Diskreta from "../components/Diskreta";
import { USER_DIGEST } from "../constants";
import generateKeyPair from "../util/generateKeypair";
import { createDigest } from "../util/createDigest";

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
            onConfirm: () => {

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
        const digest = createDigest(nick, password)

        const encryptedDigest = util.encode64(publicKey.encrypt(digest))

        localStorage.setItem(USER_DIGEST, encryptedDigest)

        console.table({ encryptedDigest, digest, eq: privateKey.decrypt(encryptedDigest) === digest })

        const response = await fetch(`${process.env.REACT_APP_BE_DOMAIN}/api/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ digest, nick, publicKey: pki.publicKeyToPem(publicKey) })
        })

        if (response.ok) {
            const { token: encryptedToken, user, refreshToken: encryptedRefreshToken } = await response.json() as LoginResponse

            const [token, refreshToken] = [encryptedToken, encryptedRefreshToken].map(enc => privateKey.decrypt(enc))

            const newUserState = {
                ...user,
                digest,
                token,
                refreshToken,
                privateKey: pki.privateKeyToPem(privateKey)
            }

            console.log(newUserState)

            setUser(newUserState)
            navigate("/")
        }
    }

    return <Container>
        <Row>
            <Col lg={4} className="mx-auto p-5 bg-dark">
                <div className="text-white"><Diskreta /></div>
                <h6 className="text-white text-center">Register</h6>

                <Form onSubmit={handleSubmit} className="enter-form d-flex flex-column">
                    <Form.Control
                        type="text"
                        className="rounded-0 mb-4 bg-transparent text-white"
                        value={nick}
                        onChange={e => setNick(e.target.value)}
                        placeholder="Nickname"
                        required
                    />

                    <InputGroup className="rounded-0">

                        <Form.Control
                            required
                            className="rounded-0 bg-transparent text-white me-2"
                            type={showPwd ? "text" : "password"}
                            onChange={e => setPassword(e.target.value)}
                            value={password}
                            placeholder="Password"
                        />

                        <Button
                            variant="outline-secondary"
                            className="rounded-0 text-white d-flex align-items-center"
                            onClick={handleToggleShowPwd}
                            style={{ cursor: "pointer", borderWidth: 3 }}
                        >
                            {
                                showPwd
                                    ? <Eye className="text-warning" style={{ transform: 'scale(1.25)' }} />
                                    : <EyeSlash style={{ transform: 'scale(1.25)' }} />
                            }
                        </Button>
                    </InputGroup>

                    <Form.Control className="btn btn-outline-primary ms-auto w-50 my-3 rounded-0 font-monospace register"
                        style={{ borderWidth: 3 }}
                        type="submit" value="Register" />

                    <Link className="text-white" to={'/login'}>Already have an account?</Link>
                </Form>
            </Col>
        </Row>
    </Container>
}