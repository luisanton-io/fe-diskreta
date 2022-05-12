interface Dialog {
    Content: () => JSX.Element
    submitLabel: string | null
    onConfirm: () => void
}

interface CurrentUser extends User {
    privateKey: string
}

interface LoggedUser extends CurrentUser {
    token: string
    digest: string
}