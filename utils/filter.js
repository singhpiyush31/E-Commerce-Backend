exports.searchRegex = (value) => {
    return { $regex: value, $options: "i" };
};

exports.numberRange = (min, max) => {
    let range = {};
    if (min) {
        range.$gte = Number(min);
    }
    if (max) {
        range.$lte = Number(max);
    }

    return range;
};

exports.dateRange = (from, to) => {
    let range = {};
    if (from) {
        range.$gte = new Date(from);
    }
    if (to) {
        range.$lte = new Date(to);
    }
    return range;
}