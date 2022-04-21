import { Container, Row, Col, Form } from "react-bootstrap";
import { sha256 } from "js-sha256";
import { useState } from "react";

export default function Login() {

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");


    const digest = sha256(username + password)
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        console.table({ username, password, digest })
    }


    return <Container>
        <Row className="h-100">
            <Col lg={4} className="mx-auto p-5 bg-secondary">
                <div style={{ width: 100, height: 100, backgroundColor: `#${digest.slice(-6)}` }}></div>
                <Form className="d-flex flex-column" onSubmit={handleSubmit}>
                    <Form.Control onChange={e => { setUsername(e.target.value) }} className="rounded-0 mb-4" type="text" placeholder="Username" />
                    <Form.Control onChange={e => { setPassword(e.target.value) }} className="rounded-0 mb-4" type="password" placeholder="Password" />

                    <Form.Control type="submit" className="ms-auto w-50 rounded-0" value="LOGIN" />
                </Form>
            </Col>
        </Row>
    </Container>
}