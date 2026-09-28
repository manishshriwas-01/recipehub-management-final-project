import { pipeline } from "@huggingface/transformers";

let sentimentPipeline;

export const getSentimentPipeline = async () => {
    if (!sentimentPipeline) {
        sentimentPipeline = await pipeline(
            "sentiment-analysis",
            "Xenova/distilbert-base-uncased-finetuned-sst-2-english"
        );
    }

    return sentimentPipeline;
};

export const analyzeSentiment = async (text) => {
    const classifier = await getSentimentPipeline();

    const result = await classifier(text);

    const { label, score } = result[0];

    if (score < 0.65) {
        return "neutral";
    }

    return label === "POSITIVE" ? "positive" : "negative";
};