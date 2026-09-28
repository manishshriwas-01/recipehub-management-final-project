import { analyzeSentiment } from "./sentiment.js";

const testSentiment = async () => {
    const positive = await analyzeSentiment(
        "This recipe is absolutely delicious and amazing!"
    );

    const negative = await analyzeSentiment(
        "This recipe is terrible and tastes very bad."
    );

    console.log("Positive:", positive);
    console.log("Negative:", negative);
};

testSentiment();