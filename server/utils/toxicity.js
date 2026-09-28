import * as toxicity from "@tensorflow-models/toxicity";

let toxicityModel;

const getToxicityModel = async () => {
    if (!toxicityModel) {
        toxicityModel = await toxicity.load(0.8);
    }

    return toxicityModel;
};

export const isToxic = async (text) => {
    const model = await getToxicityModel();
    const predictions = await model.classify([text]);

    return predictions.some(
        prediction =>
            prediction.results[0].match &&
            prediction.label !== "neutral"
    );
};