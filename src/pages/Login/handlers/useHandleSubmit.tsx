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
import { useState } from "react"

export default function useHandleSubmit(nick: string, password: string) {

    const [loading, setLoading] = useState(false)

    const setUser = useSetRecoilState(userState)
    const setChats = useSetRecoilState(chatsState)

    const navigate = useNavigate()

    const handleRegenerate = useHandleRegenerate(nick, password)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)

        try {
            if (!nick || !password) {
                return toast.error("Credentials missing")
            }

            const digest = createDigest(nick, password)

            const toastId = toast.info("Connecting...")

            const {
                data: { token: encryptedToken, refreshToken, user: responseUser }
            } = await API.post<LoginResponse>("/users/session", { nick, digest })

            // We try to decrypt the store with the current user digest

            try {
                toast.update(toastId, { render: "Decrypting user data..." })
                const { chats, user } = decryptLocalStorage(digest)

                const token = pki.privateKeyFromPem(user.privateKey).decrypt(util.decode64(encryptedToken))

                await new Promise<void>((resolve) => {
                    setTimeout(() => {
                        setUser({ ...user, token, refreshToken })
                        setChats(chats)
                        navigate("/")
                        toast.dismiss()
                        resolve()
                    }, 1000)
                })
            } catch {
                toast.error("User data decryption failed. Regenerate keys?")
                handleRegenerate(encryptedToken, refreshToken, responseUser)
            }

        } catch (error) {
            toast.error(
                error instanceof AxiosError
                    ? error.response?.data?.error
                    : (error as Error).message
            )

        } finally {
            setLoading(false)
        }
    }

    return { handleSubmit, loading }
}