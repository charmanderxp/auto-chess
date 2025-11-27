import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-chai-matchers";

// IMPORTANT:
// This project is intended to be used inside the official FHEVM Hardhat template.
// That template already wires the fhevm plugin + network settings.
// If you paste this into the template, keep the template’s existing imports/config.
//
// If you need to add the plugin manually, it looks like:
//
//   import "@fhevm/hardhat-plugin";
//
// Then configure networks per Zama docs.

import { HardhatUserConfig } from "hardhat/config";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 }
    }
  }
};

export default config;
