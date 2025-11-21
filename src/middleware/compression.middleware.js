import compression from "compression";

export const applyCompression = (app) => {
    app.use(compression());
};
