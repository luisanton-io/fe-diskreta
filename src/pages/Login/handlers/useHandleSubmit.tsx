import API from "API"
import { userState } from "atoms/user"
import { chatsState } from "atoms/chats"
import { AxiosError } from "axios"
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

            const {
                data: { token: encryptedToken, refreshToken, user: responseUser }
            } = await API.post<LoginResponse>("/users/session", { nick, digest })

            // We try to decrypt the store with the current user digest
            try {
                const { chats, user } = decryptLocalStorage(digest)

                const token = pki.privateKeyFromPem(user.privateKey).decrypt(util.decode64(encryptedToken))

                setUser({ ...user, token, refreshToken })
                setChats(chats)
                navigate("/")
                toast.dismiss()
            } catch {
                handleRegenerate(encryptedToken, refreshToken, responseUser)
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