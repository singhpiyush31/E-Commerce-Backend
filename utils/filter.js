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
