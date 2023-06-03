export default function maskUser(user: LoggedUser | null) {

    if (!user) return null

    const publicUser = { ...user } as User & Partial<LoggedUser>

    delete publicUser.digest
    delete publicUser.privateKey
    delete publicUser.token
    delete publicUser.refreshToken
    delete publicUser.settings

    return publicUser

}