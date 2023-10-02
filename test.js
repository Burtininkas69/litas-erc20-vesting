const {
  ethers
} = require('hardhat');
const {
  expect
} = require('chai');
const UniswapV2Router02 = require('../UniswapV2Router02.json'); // This is the ABI

describe("LitasToken and Vesting", function () {
  let LitasToken, Vesting, litas, vesting;
  let owner, TeamWallet, ExchangeWallet, BusinessWallet, WarehouseWallet, AdvisorWallet, CharityWallet, ReserveWallet, addrs;

  beforeEach(async function () {
      LitasToken = await ethers.getContractFactory("LitasToken");
      Vesting = await ethers.getContractFactory("Vesting");
      
      [owner, TeamWallet, ExchangeWallet, BusinessWallet, WarehouseWallet, AdvisorWallet, CharityWallet, ReserveWallet, ...addrs] = await ethers.getSigners();

      vesting = await Vesting.deploy(TeamWallet.address, ExchangeWallet.address, BusinessWallet.address, WarehouseWallet.address, AdvisorWallet.address, CharityWallet.address, ReserveWallet.address);
      litas = await LitasToken.deploy(vesting.address);
      await vesting.attachContract(litas.address);
  });

  describe("LitasToken", function () {
      it("Should have the correct name and symbol", async function () {
          expect(await litas.name()).to.equal("LITAS");
          expect(await litas.symbol()).to.equal("LT");
      });

      it("Vesting contract should hold the total vesting supply", async function () {
          expect(await litas.balanceOf(vesting.address)).to.equal(ethers.utils.parseEther("95000000"));
      });
      it("Owner should hold supply for public sale", async function() {
        expect(await litas.balanceOf(owner.address)).to.equal(ethers.utils.parseEther("5000000"));
      })
  });

  describe("Vesting", function () {
      it("Should not allow withdrawal before vesting starts", async function () {
          await expect(vesting.connect(TeamWallet).withdraw()).to.be.revertedWith("Vesting has not been started");
      });

      it("Should allow owner to start vesting", async function () {
          await vesting.startVesting();
          expect(await vesting.vestingStart()).to.not.equal(0);
      });

      it("Should allow withdrawal after vesting starts", async function () {
          await vesting.startVesting();

          await network.provider.send("evm_increaseTime", [11 * 30 * 24 * 60 * 60]);  // 11 months in seconds
          await network.provider.send("evm_mine");  // Mine a new block to actually change the timestamp

          await vesting.connect(TeamWallet).withdraw();  // Ensure this works without error.
      });

      it("Should not allow non-owners to start vesting", async function () {
          await expect(vesting.connect(TeamWallet).startVesting()).to.be.revertedWith("Not the owner");
      });

      it("Should not allow adding vesting slice for an invalid option", async function () {
          await expect(vesting.addVestingSlice(TeamWallet.address, ethers.utils.parseEther("1"), 8)).to.be.revertedWith("Wrong vesting option");
      });

      it("Should allow owner to add a vesting slice", async function () {
          await vesting.addVestingSlice(TeamWallet.address, 100000, 1);
      });

      it("Should not allow non-owners to add a vesting slice", async function () {
          await expect(vesting.connect(TeamWallet).addVestingSlice(TeamWallet.address, ethers.utils.parseEther("1"), 1)).to.be.revertedWith("Not the owner");
      });

      it("Should allow withdrawal of TGE instantly", async function() {
        // Assuming 10% TGE
        await vesting.startVesting();

        // Should be able to withdraw 10% instantly.
        await vesting.connect(ReserveWallet).withdraw();
        const balance = await litas.balanceOf(ReserveWallet.address);
        expect(balance).to.be.above(ethers.utils.parseEther("1750000"));
        expect(balance).to.be.below(ethers.utils.parseEther("1760000"));

    });

    it("Should hold locking period without withdrawals", async function() {
      await vesting.startVesting();

      // Simulate 1.5 months
      await network.provider.send("evm_increaseTime", [1.5 * 30 * 24 * 60 * 60]);
      await network.provider.send("evm_mine");

      // TeamWallet attempts to withdraw, which should fail
      await expect(vesting.connect(TeamWallet).withdraw()).to.be.revertedWith("No vested tokens to withdraw");
    });

    it("Should start withdrawals instantly after lockup periods", async function() {
      await vesting.startVesting();

      // Simulate 1.5 months
      await network.provider.send("evm_increaseTime", [2 * 30 * 24 * 60 * 60]);
      await network.provider.send("evm_mine");

      const balance = await litas.balanceOf(TeamWallet.address);
      expect(balance).to.be.below(ethers.utils.parseEther("1"));
  });

    it("Should allow withdrawal of all tokens after 12 months", async function() {
        await vesting.startVesting();

        // Simulate 12 months
        await network.provider.send("evm_increaseTime", [365 * 24 * 60 * 60]);
        await network.provider.send("evm_mine");

        // Should be able to withdraw all remaining tokens.
        await vesting.connect(TeamWallet).withdraw();
        const balance = await litas.balanceOf(TeamWallet.address);
        expect(balance).to.equal(ethers.utils.parseEther("14000000")); // 100% of total
    });
  });
});