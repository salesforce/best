export const findInconsistencies = (set, property) => {
    const values = [...set[property]];
    let previous = values.shift();
    const inconsistencies = values.reduce((badSet, value, idx) => {
        if (previous !== value) {
            previous = value;
            badSet.push(idx + 1);
        }

        return badSet;
    }, []);
    return inconsistencies;
};
