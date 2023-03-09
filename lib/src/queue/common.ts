interface Queue<T> {
    getNextJob: () => Promise<T>
}

export {
    Queue
}