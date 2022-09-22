import { useLocation} from "react-router-dom";
import styles from "./NotFound.module.css";

export default function NotFound() {
    let location = useLocation();
    return (
        <div className={styles.message}>404</div>
    );
}