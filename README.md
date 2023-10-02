# Litas-erc20-vesting

Hardhat testing:
npx hardhat test

![photo_2023-10-02_17-20-55](https://github.com/Burtininkas69/litas-erc20-vesting/assets/146741351/332349bf-cce2-4769-99e1-4f4a49072ee8)

Deployment steps:
1. Deploy Vesting contract
2. Deploy Litas erc20 contract with Vesting contract address in constructor
3. Call Vesting.attachContract with Litas contract address
