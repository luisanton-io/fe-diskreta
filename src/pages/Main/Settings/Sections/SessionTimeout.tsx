import Section from ".";

export default function SessionTimeout() {
    return <Section title="Session Timeout">
        <span>Time in seconds for the application to log you out when inactive. Use 0 as value to disable.</span>
        <input type="number"></input>
    </Section>
}