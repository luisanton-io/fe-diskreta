import { focusState } from "atoms/focus";
import { sessionTimeoutState } from "atoms/sessionTimeout";
import { userState } from "atoms/user";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";

export default function FocusHandler() {
    const navigate = useNavigate()
    const setUser = useSetRecoilState(userState)

    const [focus, setFocus] = useRecoilState(focusState)
    const sessionTimeout = useRecoilValue(sessionTimeoutState)

    useEffect(() => {
        const focusDaemon = setInterval(() => {
            setFocus(!document.hidden && document.hasFocus())
        }, 1000)

        return () => {
            clearInterval(focusDaemon)
        }
    }, [setFocus])

    useEffect(() => {
        console.table({ focus, sessionTimeout })
        const logoutTimeout = setTimeout(() => {
            if (!!sessionTimeout && !focus && !['/register', '/login'].includes(window.location.pathname)) {
                window.location.reload()
            }
        }, sessionTimeout * 1000)

        return () => {
            clearTimeout(logoutTimeout)
        }
    }, [focus, navigate, setUser, sessionTimeout])

    return null
}