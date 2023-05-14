export default function Section({ title, children }: React.PropsWithChildren<{ title: string }>) {
    return (
        <section className="p-5">
            <h6>{title}</h6>
            <hr />
            {children}
        </section>
    )
}