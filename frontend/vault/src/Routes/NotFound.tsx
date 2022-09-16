import { useLocation} from "react-router-dom";


export default function NotFound() {
    let location = useLocation();
    return (
        <div><h1>Route {location.pathname} does not exists</h1></div>
    );
}