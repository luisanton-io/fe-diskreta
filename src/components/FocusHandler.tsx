import { focusState } from "atoms/focus";
import { userState } from "atoms/user";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useRecoilState, useSetRecoilState } from "recoil";

export default function FocusHandler() {
    const navigate = useNavigate()
    const setUser = useSetRecoilState(userState)

    const [focus, setFocus] = useRecoilState(focusState)

    useEffect(() => {
        const focusDaemon = setInterval(() => {
            setFocus(!document.hidden && document.hasFocus())
        }, 1000)

        return () => {
            clearInterval(focusDaemon)
        }
    }, [setFocus])

    useEffect(() => {
        if (!focus) {
            setUser(u => u && ({
                ...u,
                token: '', // will disconnect socket
                refreshToken: ''
            }))
            navigate('/login')
        }
    }, [focus])

    return null
}