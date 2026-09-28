import { isToxic } from "./toxicity.js";

const testToxicity = async () => {
    const safe = await isToxic(
        "This recipe is really delicious and easy to make."
    );

    const toxic = await isToxic(
        "You are stupid and this is a terrible recipe."
    );

    console.log("Safe:", safe);
    console.log("Toxic:", toxic);
};

testToxicity();