import { pki, util } from "node-forge"
import { createSignedDigest } from "util/createDigest"

export default function useHandleDigestUpdate() {
    const handleDigestUpdate = async (user: CurrentUser, newPassword: string) => {

        const { digest, signedDigest } = createSignedDigest(user, newPassword)

        console.table({ digest, signedDigest })

        // PUT user's digest sending the new digest signed with the PRIVATE key
        // the server will be able to verify the sender identity verifying with the PUBLIC key.

        const updateResponse = await fetch(`${process.env.REACT_APP_BE_DOMAIN}/api/users`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                nick: user.nick,
                digest,
                signedDigest
            })
        })

        if (!updateResponse.ok) {
            throw new Error("Error updating user. Please try again later.")
        }

        const { token: encryptedToken } = await updateResponse.json() as LoginResponse

        return { digest, token: pki.privateKeyFromPem(user.privateKey).decrypt(util.decode64(encryptedToken)) }

    }

    return handleDigestUpdate
}