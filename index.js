const { ethers, utils: ethersUtils } = require("ethers");
const { Geb, utils } = require("geb.js");
const redis = require("redis");
require("dotenv").config();

const main = async () => {
  const client = redis.createClient({
    url: `${process.env.REDIS_PROTOCOL}://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
  });

  // Define a function to handle SIGINT
  const handleSignal = () => {
    isFinished = true; // Set the flag to exit the main loop
    client.quit(); // Close the Redis client
    process.exit(0); // Exit the process gracefully
  };

  // Set up the signal handler for SIGINT
  process.on("SIGINT", handleSignal);

  try {
    await client.connect();

    const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);

    const geb = new Geb("mainnet", provider);

    const safe = await geb.getSafe(2400);
    let isFinished = false;
    let i = 1;
    let triesCounter = 0;
    while (!isFinished) {
      console.log(`getting safe ${i} data`);
      try {
        const safe = await geb.getSafe(i);
        triesCounter = 0;
        safe.safeId;

        const debt = utils.wadToFixed(safe.debt).toString();
        const liquidationPrice =
          (await safe.liquidationPrice())?.toString() || "N/A";

        await client.hSet(`safe:${i}`, {
          id: i,
          debt: debt,
          liquidationPrice,
        });

        console.log(`Safe id ${i} has: ${debt} RAI of debt.`);
        console.log(
          `It will get liquidated if ETH price falls below ${liquidationPrice} USD.`
        );
        i++;
      } catch (err) {
        if (triesCounter > 10) {
          i = 1;
        } else {
          console.log(err, `trying again: ${triesCounter}`);
          triesCounter++;
        }
      }
    }
  } catch (err) {
    console.log(err);
  }
};

main();
