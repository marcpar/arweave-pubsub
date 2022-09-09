import styles from "./AppBadge.module.css";
type AppBadgeProps = {
    name: string
}

export default function AppBadge(props: AppBadgeProps) {
    return (
        <div className={styles.name}>
            <div>{props.name}</div>
        </div>
    )
}