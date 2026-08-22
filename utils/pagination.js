exports.getPagination = (query, defaultLimit = 10, maxLimit = 50) => {
    let page = parseInt(query.page) || 1;
    let limit = parseInt(query.limit) || defaultLimit;

    if (page <= 0) page = 1;
    if (limit <= 0) limit = defaultLimit;
    if (limit > maxLimit) limit = maxLimit;

    const skip = (page - 1) * limit;

    return { page, limit, skip };
};
