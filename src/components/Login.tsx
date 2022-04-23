import { Container, Row, Col, Form } from "react-bootstrap";
import { sha256 } from "js-sha256";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSetRecoilState } from "recoil";
import { userState } from "../atoms/user";
import { pki } from "node-forge"
import { cryptico, RSAKey } from '@daotl/cryptico'


function generateKeyPair(prng = 'secret') {
    return new Promise<pki.rsa.KeyPair>((resolve, reject) => {
        pki.rsa.generateKeyPair({ bits: 2048, e: 0x10001, workers: 2, prng }, (err, keypair) => {
            if (err) reject(err)
            else resolve(keypair)
        });
    })
}

const key = generateKeyPair('ciaone')
const key2 = generateKeyPair('ciaone')
const key3 = generateKeyPair('ciaone')
export default function Login() {

    Promise.all([key, key2, key3].map(async k => { console.log((await k).publicKey) }))

    const navigate = useNavigate()

    const [username, setUsername] = useState("johnDoe");
    const [password, setPassword] = useState("123456");

    const setUser = useSetRecoilState(userState)

    const digest = sha256(username + password)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        console.table({ username, password, digest })
        if (localStorage.getItem('uuid') !== digest
            && !window.confirm("You previously logged in with another user on this device. Continuing will destroy all data associated with the previous user. Continue?")) {
            return
        }

        const keypair = await generateKeyPair();



        localStorage.setItem('uuid', digest)
        navigate("/")
        setUser(u => ({ username, pubkey: "PUBKEY", id: digest }))
        // setUser(u => ({ username, pubkey: publicKey.export.toString(), id: digest }))
    }

    return <Container>
        <Row className="h-100">
            <Col lg={4} className="mx-auto p-5 bg-secondary">
                <div style={{ width: 100, height: 100, backgroundColor: `#${digest.slice(-6)}` }}></div>
                <Form className="d-flex flex-column" onSubmit={handleSubmit}>
                    <Form.Control onChange={e => { setUsername(e.target.value) }} value={username} className="rounded-0 mb-4" type="text" placeholder="Username" />
                    <Form.Control onChange={e => { setPassword(e.target.value) }} value={password} className="rounded-0 mb-4" type="password" placeholder="Password" />

                    <Form.Control type="submit" className="ms-auto w-50 rounded-0" value="LOGIN" />
                </Form>
            </Col>
        </Row>
    </Container>
}