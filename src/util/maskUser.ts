export default function maskUser(user: LoggedUser | null) {

    if (!user) return null

    const publicUser = structuredClone(user) as User & Partial<LoggedUser>

    delete publicUser.digest
    delete publicUser.privateKey
    delete publicUser.token

    return publicUser

}