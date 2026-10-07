export const buildLogger = (context) => {
    const buildMsg = (msg) => `${context} ${msg}`;
    return {
        info: (msg) => console.log(buildMsg(msg)),
        error: (msg) => console.error(buildMsg(msg)),
    };
};
