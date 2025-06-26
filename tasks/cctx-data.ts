import { task } from "hardhat/config"
import { getCctxByInboundHash } from "../scripts/getCctxData"

import type { TaskArguments } from "hardhat/types"


task("cctx-data", "Prints the cross-chain transaction (CCTX) data by inbound tx hash")
  .addParam("hash", "The inbound transaction hash")
  .setAction(async (taskArgs: TaskArguments): Promise<void> => {
    await getCctxByInboundHash(taskArgs.hash);
  })
