import path from "path";
import os from "os";

export default (dirname = "best") => {
    const { getuid } = process;
    if (getuid == null) {
        return path.join(os.tmpdir(), dirname);
    }
    // On some platforms tmpdir() is `/tmp`, causing conflicts between different
    // users and permission issues. Adding an additional subdivision by UID can
    // help.
    return path.join(os.tmpdir(), `${dirname}_${getuid.call(process).toString(36)}`);
};
