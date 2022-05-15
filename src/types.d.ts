interface Dialog {
    Content: () => JSX.Element
    submitLabel?: string
    cancelLabel?: string
    onConfirm: () => void
}

interface CurrentUser extends User {
    privateKey: string
}

interface LoggedUser extends CurrentUser {
    token: string
    digest: string
}