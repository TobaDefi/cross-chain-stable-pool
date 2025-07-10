import { task } from "hardhat/config";

task("call-contract", "Calls a method on the specified contract")
  .addParam("contract", "The name of the contract (e.g., MyContract)")
  .addParam("address", "The address of the deployed contract")
  .addParam("method", "The name of the method to call")
  .addOptionalParam("args", "JSON array of arguments, e.g., '[\"0x123\", 42]'")
  .setAction(async ({ contract, address, method, args }, hre) => {
    const parsedArgs = args ? JSON.parse(args) : [];
    const [signer] = await hre.ethers.getSigners();

    console.log(`📞 Calling '${method}' on contract '${contract}' at ${address} with arguments:`, parsedArgs);

    // Load the contract
    const factory = (await hre.ethers.getContractFactory(contract)) as any;
    const contractInstance = factory.attach(address).connect(signer);

    // Check if the method exists
    if (typeof contractInstance[method] !== "function") {
      console.error(`❌ Method '${method}' not found in contract '${contract}'`);
      return;
    }

    try {
      const result = await contractInstance[method](...parsedArgs);
      console.log("✅ Call result:", result);
    } catch (error) {
      console.error("❌ Error while calling the method:", error);
    }
  });