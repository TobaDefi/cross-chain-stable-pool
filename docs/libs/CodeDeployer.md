# Solidity API

## CodeDeployer

_Library used to deploy contracts with specific code. This can be used for long-term storage of immutable data as
contract code, which can be retrieved via the `extcodecopy` opcode._

### CodeDeploymentFailed

```solidity
error CodeDeploymentFailed()
```

### deploy

```solidity
function deploy(bytes code, bool preventExecution) internal returns (address destination)
```

_Deploys a contract with `code` as its code, returning the destination address.
If preventExecution is set, prepend an invalid opcode to ensure the "contract" cannot be executed.
Rather than add a flag, we could simply always prepend the opcode, but there might be use cases where fidelity
is required.

Reverts if deployment fails._

