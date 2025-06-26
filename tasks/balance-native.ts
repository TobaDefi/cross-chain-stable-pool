import { ethers, BigNumber, utils } from "ethers"
import { task } from "hardhat/config"
import type { TaskArguments } from "hardhat/types"



task("balance-native", "Prints an account's balance")
    .addParam("rpcUrl", "The JSON-RPC URL of the Ethereum node")
    .addParam("account", "The account's address")
    .setAction(async (taskArgs: TaskArguments): Promise<void> => {

        const jsonRpcProvider = taskArgs.rpcUrl
        const provider = ethers.getDefaultProvider(jsonRpcProvider)

        const network = await provider.getNetwork();
        const chainId = network.chainId;
        console.log(`Network: ${network.name} (Chain ID: ${chainId})`);


        const account: string = utils.getAddress(taskArgs.account)
        const balance: BigNumber = await provider.getBalance(account)

        console.log(`${utils.formatEther(balance)} native token`)
    })
