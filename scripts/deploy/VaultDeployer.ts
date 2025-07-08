import { ethers } from "hardhat";
import { BaseContract } from "ethers";

import * as contract from "../../contract";
import { VaultDeploymentInputParams, VaultDeploymentParams } from "./types";

import TypesConverter from "../types/TypesConverter";
import {
  ProtocolFeeController,
  Vault,
  VaultAdmin,
  VaultExtension,
} from "./../../typechain-types";

import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

const _MINIMUM_TRADE_AMOUNT = 1e6;
const _MINIMUM_WRAP_AMOUNT = 1e3;

export async function deploy(params: VaultDeploymentInputParams = {}): Promise<Vault> {
  const deployment = await TypesConverter.toVaultDeployment(params);

  const basicAuthorizer = await deployBasicAuthorizer(deployment.admin);
  return await deployReal(deployment, basicAuthorizer);
}

async function deployReal(deployment: VaultDeploymentParams, authorizer: BaseContract): Promise<Vault> {
  const { admin, pauseWindowDuration, bufferPeriodDuration } = deployment;

  const futureVaultAddress = await getVaultAddress(admin);

  const vaultAdmin: VaultAdmin = await contract.deploy('VaultAdmin', {
    args: [futureVaultAddress, pauseWindowDuration, bufferPeriodDuration, _MINIMUM_TRADE_AMOUNT, _MINIMUM_WRAP_AMOUNT],
    from: admin,
  });

  const vaultExtension: VaultExtension = await contract.deploy('VaultExtension', {
    args: [futureVaultAddress, vaultAdmin],
    from: admin,
  });

  const protocolFeeController: ProtocolFeeController = await contract.deploy('ProtocolFeeController', {
    args: [futureVaultAddress, 0, 0],
    from: admin,
  });

  return await contract.deploy('Vault', {
    args: [vaultExtension, authorizer, protocolFeeController],
    from: admin,
  });
}


/// Returns the Vault address to be deployed, assuming the VaultExtension is deployed by the same account beforehand.
async function getVaultAddress(from: SignerWithAddress): Promise<string> {
  const nonce = await from.getNonce();
  const futureAddress = ethers.getCreateAddress({
    from: from.address,
    nonce: nonce + 3,
  });
  return futureAddress;
}

