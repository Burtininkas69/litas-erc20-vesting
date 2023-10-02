# Litas-erc20-vesting

Hardhat testing:
npx hardhat test

Deployment steps:
1. Deploy Vesting contract
2. Deploy Litas erc20 contract with Vesting contract address in constructor
3. Call Vesting.attachContract with Litas contract address
