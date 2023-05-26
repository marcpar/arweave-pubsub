import { GridLoader } from "react-spinners";
import style from './Redirecting.module.css';

export default function Redirecting() {
    return (
        <div className={style.main}>
            <div className={style.message}>Please wait, you are being redirected to the updated version of the app</div>
            <div className={style.loader_container}>
                <GridLoader color={"rgb(0, 98, 190)"} />
            </div>
        </div>
    );
}