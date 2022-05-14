import { pki, util } from "node-forge";
import { useRef, useState } from "react";
import { Button, Col, Container, Form, InputGroup, Row } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useRecoilState, useSetRecoilState } from "recoil";
import { userState } from "../../atoms/user";
import { dialogState } from "../../atoms/dialog";
import { chatsState, defaultChats } from "../../atoms/chats";
import Diskreta from "../../components/Diskreta";
import { CHATS, USER, USER_DIGEST } from "../../constants";
import generateKeyPair from "../../util/generateKeypair";
import { rejects } from "assert";
import { createDigest, createSignedDigest } from "../../util/createDigest";
import withHysteresis from "../../util/withHysteresis";
import decryptLocalStorage from "../../util/decryptLocalStorage";
import useHandleSubmit from "./handlers/useHandleSubmit";

export default function Login() {

    const navigate = useNavigate()

    const [nick, setNick] = useState("");
    const [password, setPassword] = useState("");

    const setUser = useSetRecoilState(userState)
    const setChats = useSetRecoilState(chatsState)
    const [Dialog, setDialog] = useRecoilState(dialogState)

    const mnemonic = useRef("")
    const newPassword = useRef("")

    const oldDigestEncrypted = localStorage.getItem(USER_DIGEST)

    const handleSubmit = useHandleSubmit(nick, password)

    // const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    //     e.preventDefault()

    //     if (!nick || !password) {
    //         return toast.error("Credentials missing")
    //     }

    //     try {

    //         const digest = createDigest(nick, password)

    //         const response = await fetch(`${process.env.REACT_APP_BE_DOMAIN}/api/users/session`, {
    //             method: "POST",
    //             headers: {
    //                 "Content-Type": "application/json"
    //             },
    //             body: JSON.stringify({ nick, digest })
    //         })

    //         if (!response.ok) {
    //             toast.error("Wrong credentials!")
    //         } else {
    //             const { token: encryptedToken, user: responseUser } = await response.json() as LoginResponse

    //             // We try to decrypt the store with the current user digest
    //             const { error, chats, user } = decryptLocalStorage(digest)

    //             if (!error) {
    //                 const token = pki.privateKeyFromPem(user.privateKey).decrypt(util.decode64(encryptedToken))

    //                 setUser({ ...user, token })
    //                 setChats(chats)
    //                 navigate("/")
    //             } else {
    //                 if (oldDigestEncrypted && !window.confirm("Signing in with a new user will destroy all data associated with any previous user. Continue?")) {
    //                     return
    //                 }

    //                 localStorage.clear()

    //                 const handleRegenerate = async (e?: React.FormEvent) => {
    //                     e?.preventDefault()

    //                     toast.promise(new Promise<void>((resolve) => {
    //                         setTimeout(async () => {
    //                             const { privateKey } = await generateKeyPair(mnemonic.current)

    //                             setUser({
    //                                 ...responseUser,
    //                                 token: privateKey.decrypt(util.decode64(encryptedToken)),
    //                                 privateKey: pki.privateKeyToPem(privateKey),
    //                                 digest: createDigest(nick, password)
    //                             })
    //                             setChats(defaultChats)
    //                             navigate("/")

    //                             resolve()
    //                         }, 1000)
    //                     }), {
    //                         pending: "Generating your keys...",
    //                         error: "Error generating your keys. Please try again.",
    //                         success: "Your keys have been generated"
    //                     })
    //                 }

    //                 setDialog({
    //                     submitLabel: "Generate",
    //                     Content: () => {
    //                         return (
    //                             <Form className="p-5" onSubmit={handleRegenerate}>
    //                                 <p>Welcome to a new device. You need to regenerate your keypair in order to use Diskreta here.</p>
    //                                 <p>Please note we do not store your messages and you will need to export them from your old device.</p>
    //                                 <p>This feature is planned for upcoming releases.</p>
    //                                 <p><strong>If this is not your device,</strong> log out after your session to destroy your data.</p>
    //                                 <Form.Control type="text" placeholder="Seed" onChange={e => { mnemonic.current = e.target.value }} />
    //                             </Form>
    //                         )
    //                     },
    //                     onConfirm: handleRegenerate
    //                 })

    //             }



    //         }

    //     } catch (error) {
    //         toast.error((error as Error).message)
    //     }
    // }

    const handleRecovery = async () => {
        console.log("handleRecovery")

        if (!nick) {
            return toast.error("Please enter your nickname")
        }

        const response = await toast.promise(
            withHysteresis(fetch(`${process.env.REACT_APP_BE_DOMAIN}/api/users?nick=${nick}&exact=true`)),
            {
                pending: `Looking for ${nick}...`,
                error: `Can't reach server. Please try again later.`,
            })

        if (response.status === 404) {
            return toast.error("User not found")
        }

        const handleDialogSubmit = async (e?: React.FormEvent) => {

            e?.preventDefault()

            console.log(mnemonic.current)

            toast.promise(new Promise<{ publicKey: pki.rsa.PublicKey, privateKey: pki.rsa.PrivateKey }>((resolve, reject) => {
                if (mnemonic.current.split(' ').length !== 24) return reject()

                setTimeout(async () => {
                    resolve(await generateKeyPair(mnemonic.current))
                }, 1000)

            }), {
                pending: "Generating your keys...",
                error: "Error generating your keys. Please make sure your seed is correct and 24 words long.",
                success: "Your keys have been generated"
            })
                .then(({ privateKey, publicKey }) =>
                    toast.promise(
                        withHysteresis(
                            (async () => {
                                const responseUser = await response.json() as User

                                if (responseUser.publicKey !== pki.publicKeyToPem(publicKey)) {
                                    return Promise.reject()
                                }

                                return { responseUser, privateKey }
                            })()
                        )
                        ,
                        {
                            pending: "Retrieving your user's public key...",
                            error: nick + "'s keys were not generated using this mnemonic.",
                            success: "Please enter a new password."
                        },
                    ))
                .then(({ responseUser, privateKey }) => {

                    // From now we can safely assume that the keys for user {nick} were generated using the same mnemonic
                    // Before setting recoil let's first make sure there wasn't a previous user logged in 
                    // That is to give chance to the current user to NOT delete the previous user data inadvertently

                    try {
                        if (oldDigestEncrypted) {
                            const oldDigest = privateKey.decrypt(util.decode64(oldDigestEncrypted)) //throws
                            var { error, chats } = decryptLocalStorage(oldDigest)

                            if (error) throw error

                        }
                    } catch (error) {
                        console.log(error)
                        if (window.confirm(`
                            Error decrypting previous user data. Apparently, ${nick} was not the last logged in user on this device.
                            Press OK if you wish to continue generating the keys with this seed and delete all previous data.
                        `)) {
                            localStorage.clear()
                        } else return Promise.reject()
                    }

                    return ({
                        user: {
                            ...responseUser,
                            privateKey: pki.privateKeyToPem(privateKey)
                        },
                        chats
                    })
                })
                .then(({ user, chats }) => {
                    // Here we will calc new digest, send to server signed, get a JWT back.

                    const handlePasswordSubmit = async (e?: React.FormEvent) => {
                        e?.preventDefault()

                        // const digest = SHA512(nick + newPassword.current).toString()

                        const { digest, signedDigest } = createSignedDigest(user, newPassword.current)

                        console.table({ digest, signedDigest })

                        // PUT user's digest sending the new digest signed with the PRIVATE key
                        // the server will be able to verify the sender identity verifying with the PUBLIC key.

                        const updateResponse = await fetch(`${process.env.REACT_APP_BE_DOMAIN}/api/users`, {
                            method: "PUT",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                nick,
                                digest,
                                signedDigest
                            })
                        })

                        if (!updateResponse.ok) {
                            alert("Error updating user")
                            return
                        }
                        const { token: encryptedToken } = await updateResponse.json() as LoginResponse

                        // login with new digest and setUser

                        setUser({
                            ...user,
                            digest,
                            token: pki.privateKeyFromPem(user.privateKey).decrypt(util.decode64(encryptedToken))
                        })

                        setChats(chats ?? defaultChats) // either the old chats or the default if error
                        setDialog(null)
                        navigate("/")
                    }

                    setDialog({
                        submitLabel: "Confirm",
                        Content: () => (
                            <Form className="p-5" onSubmit={handlePasswordSubmit}>
                                <Form.Control type="password" placeholder="New password" onChange={e => { newPassword.current = e.target.value }} />
                            </Form>
                        ),
                        onConfirm: handlePasswordSubmit
                    })
                })
        }

        setDialog({
            submitLabel: "Generate",
            Content: () => {
                return (
                    <Form className="p-5" onSubmit={handleDialogSubmit}>
                        {
                            oldDigestEncrypted
                                ?
                                <>
                                    <p>If you were previously logged in this device, you can recover your data here.</p>
                                    <p>You need to regenerate your keypair in order to do so.</p>
                                </>
                                :
                                <>
                                    <p>No previous user data was found on this device. In order to restore your message you will need to export them from the device your were previously using.</p>
                                    <p>This feature is planned for a future release of Diskreta.</p>
                                </>
                        }
                        <strong>Please insert your 24 words mnemonic here separated by white space.</strong>
                        <Form.Control className="d-inline-block rounded-0 my-4" type="text" placeholder="Seed" onChange={e => { mnemonic.current = e.target.value }} />
                    </Form>
                )
            },
            onConfirm: handleDialogSubmit
        })
    }

    return <Container>
        <Row className="h-100">
            <Col lg={4} className="mx-auto p-5 bg-dark">
                <div className="text-white"><Diskreta /></div>
                <h6 className="text-white text-center mb-3">Login</h6>

                {/* <div style={{ width: 100, height: 100, backgroundColor: `#${digest.slice(-6)}` }}></div> */}
                <Form className="enter-form d-flex flex-column" onSubmit={handleSubmit}>
                    <Form.Control onChange={e => { setNick(e.target.value) }} value={nick} className="bg-transparent text-white rounded-0 mb-3" type="text" placeholder="Username" />
                    <InputGroup className="mb-1">
                        <Form.Control onChange={e => { setPassword(e.target.value) }} value={password} className="bg-transparent text-white rounded-0 mb-0 me-2" type="password" placeholder="Password" />

                        <Button
                            variant="outline-secondary"
                            className="rounded-0 forgot border-3"
                            onClick={handleRecovery}
                        >
                            Recover
                        </Button>
                    </InputGroup>

                    <Button type="submit"
                        variant="outline-info"
                        className=" ms-auto w-50 my-3 rounded-0 font-monospace login border-3"
                    >
                        Login
                    </Button>

                    <Link to="/register" className="text-white">Don't have an account?</Link>

                </Form>
            </Col>
        </Row>
    </Container>
}