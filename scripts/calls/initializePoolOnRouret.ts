import * as dotenv from "dotenv";
dotenv.config();

import hre from "hardhat";

const { ethers, network } = hre;
const { parseEther, parseUnits, formatEther, formatUnits, solidityPack } = ethers.utils;
import { Router, Router__factory, TestToken__factory, TestToken } from "../../typechain-types";
import { AddressZero, Zero, MaxUint256 } from "../../test/helpers";

const TOKEN_ADDRESSES_SORTED = [
    "0x03ffc595dB8d1f3558E94F6D1596F89695242643", // найменша
    "0x8113553820dAa1F852D32C3f7D97461f09012043", // середня
    "0xD509688a2D8AAed688aEFfF6dd27bE97Eb10bD8D" // найбільша
];

// const ROUTER_ADDRESS = "0xfF518a7211C9fC44D450858d301a570935F73BBd";
const ROUTER_TEST_ADDRESS = "0x46f15e4B3bBDa3C749b1A422bc6e20663d7e10B0";
// const STABLE_POOL_ADDRESS = "0x19288FB03a9ED741568eDF0898910CbCa1C7Ed86";
const STABLE_TEST_POOL_ADDRESS = "0xd75e75A2e83713497C0116227081B47493f26Ef9";

async function main() {
    const [sender] = await ethers.getSigners();
    const networkName = hre.network.name.toString();

    const routerContract = Router__factory.connect(ROUTER_TEST_ADDRESS, sender) as Router;

    console.log("\n --- Initialize Pool on Router --- \n");
    console.log("* ", sender.address, "- Caller address");
    console.log("* ", networkName, "- Network name");
    console.log("* ", ROUTER_TEST_ADDRESS, "- Contract address");
    console.log("\n --- ------- ---- --- ");

    const initializeAmount = parseUnits("100", 18);

    // Approve tokens for the router
    for (const tokenAddress of TOKEN_ADDRESSES_SORTED) {
        const tokenContract = TestToken__factory.connect(tokenAddress, sender) as TestToken;
        const approvalTx = await tokenContract.approve(ROUTER_TEST_ADDRESS, MaxUint256);
        await approvalTx.wait();
        console.log(`Approved ${tokenAddress} tokens for the router.`);
    }

    const initializePoolTx = await routerContract.initialize(
        STABLE_TEST_POOL_ADDRESS,
        TOKEN_ADDRESSES_SORTED,
        TOKEN_ADDRESSES_SORTED.map(() => initializeAmount),
        parseUnits("10", 18), // exact Bpt AmountOut
        false, // weth is eth
        "0x", // No additional user data
        { gasLimit: 5000000 }
    );

    await initializePoolTx.wait();

    console.log(`\n✅ Hash of Pool Initialization TX: ${initializePoolTx.hash}\n`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
