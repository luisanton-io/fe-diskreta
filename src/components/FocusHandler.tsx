import { focusState } from "atoms/focus";
import { useEffect } from "react";
import { useSetRecoilState } from "recoil";

export default function FocusHandler() {
    const setFocus = useSetRecoilState(focusState)

    useEffect(() => {
        const focusDaemon = setInterval(() => {
            setFocus(!document.hidden && document.hasFocus())
        }, 1000)

        return () => {
            clearInterval(focusDaemon)
        }
    }, [setFocus])

    return null
}