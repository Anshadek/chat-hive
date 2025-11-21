export const success = (res, message = "Success", data = {}, code = 200) => {
    return res.status(code).json({
        status: true,
        message,
        data
    });
};

export const error = (res, message = "Something went wrong", code = 400) => {
    return res.status(code).json({
        status: false,
        message
    });
};
