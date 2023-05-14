import { Done } from "@mui/icons-material";
import { themeState } from "atoms/theme";
import cn from "classnames";
import { ListGroup } from "react-bootstrap";
import { useRecoilState } from "recoil";
import Section from ".";

export default function Theme() {
    const [currentTheme, setCurrentTheme] = useRecoilState(themeState)

    return <Section title="Theme">
        <ListGroup>
            {
                ["Default", "Deep Blue"].map(theme => (
                    <ListGroup.Item
                        className={cn("rounded-0 mb-2 border bg-transparent", currentTheme === theme ? "border-warning text-warning" : "border-light text-white")}
                        key={theme}
                        onClick={() => setCurrentTheme(theme)}>
                        {currentTheme === theme && (
                            <Done className="position-absolute start-0 mx-2" style={{
                                fontSize: '1.25em',
                                top: '50%',
                                transform: 'translateY(-50%)'
                            }} />
                        )}
                        <span className="ms-3">{theme}</span>
                    </ListGroup.Item>
                ))
            }
        </ListGroup>
    </Section>
}