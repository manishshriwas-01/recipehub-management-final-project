export const parseRecipeFields = (req, res, next) => {
    try {
        if (typeof req.body.ingredients === 'string') {
            req.body.ingredients = JSON.parse(req.body.ingredients);
        }

        if (typeof req.body.steps === 'string') {
            req.body.steps = JSON.parse(req.body.steps);
        }

        next();
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: 'Ingredients and steps must be valid JSON arrays',
        });
    }
};