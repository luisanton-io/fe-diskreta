import API from "API"
import { chatsState } from "atoms/chats"
import { userState } from "atoms/user"
import { pki, util } from "node-forge"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import { useSetRecoilState } from "recoil"
import { createDigest } from "util/createDigest"
import decryptLocalStorage from "util/decryptLocalStorage"
import useHandleRegenerate from "./useHandleRegenerate"
import { AxiosError } from "axios"

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

            const {
                data: { token: encryptedToken, refreshToken: encryptedRefreshToken, user: responseUser }
            } = await API.post("/users/session", { nick, digest })

            // We try to decrypt the store with the current user digest
            try {
                const { chats, user } = decryptLocalStorage(digest)

                const [token, refreshToken] = [encryptedToken, encryptedRefreshToken].map(
                    (jwt: string) => pki.privateKeyFromPem(user.privateKey).decrypt(util.decode64(jwt))
                )

                setUser({ ...user, token, refreshToken })
                setChats(chats)
                navigate("/")
                toast.dismiss()
            } catch {
                handleRegenerate(encryptedToken, encryptedRefreshToken, responseUser)
            }

        } catch (error) {
            toast.error(
                error instanceof AxiosError
                    ? error.response?.data?.error
                    : (error as Error).message
            )
        }
    }

    return handleSubmit
}