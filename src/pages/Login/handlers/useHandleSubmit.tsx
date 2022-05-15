import { chatsState } from "atoms/chats"
import { userState } from "atoms/user"
import { pki, util } from "node-forge"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import { useSetRecoilState } from "recoil"
import { createDigest } from "util/createDigest"
import decryptLocalStorage from "util/decryptLocalStorage"
import useHandleRegenerate from "./useHandleRegenerate"

export default function useHandleSubmit(nick: string, password: string) {

    const setUser = useSetRecoilState(userState)
    const setChats = useSetRecoilState(chatsState)

    const navigate = useNavigate()

    const handleRegenerate = useHandleRegenerate(nick, password)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        if (!nick || !password) {
            return toast.error("Credentials missing")
        }

        try {

            const digest = createDigest(nick, password)

            const response = await fetch(`${process.env.REACT_APP_BE_DOMAIN}/api/users/session`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ nick, digest })
            })

            if (!response.ok) {
                toast.error("Wrong credentials!")
            } else {
                const { token: encryptedToken, user: responseUser } = await response.json() as LoginResponse

                // We try to decrypt the store with the current user digest
                try {
                    const { chats, user } = decryptLocalStorage(digest)
                    const token = pki.privateKeyFromPem(user.privateKey).decrypt(util.decode64(encryptedToken))

                    setUser({ ...user, token })
                    setChats(chats)
                    navigate("/")
                    toast.dismiss()
                } catch {
                    handleRegenerate(encryptedToken, responseUser)
                }
            }

        } catch (error) {
            toast.error((error as Error).message)
        }
    }

    return handleSubmit
}