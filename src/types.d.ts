interface Dialog {
    Content: () => JSX.Element
    submitLabel: string | null
    onConfirm: () => void
}

interface LoggedUser extends User {
    token: string
    privateKey: string
    digest: string
}