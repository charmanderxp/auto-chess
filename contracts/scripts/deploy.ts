import { ethers, artifacts } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
    const signers = await ethers.getSigners();
    if (signers.length === 0) {
        console.error("❌ Error: No signers found!");
        console.error("Please check your .env file in the contracts directory.");
        console.error("Make sure PRIVATE_KEY is set and is at least 64 characters long.");

        // Debug info
        const key = process.env.PRIVATE_KEY;
        console.log("Debug: PRIVATE_KEY length is:", key ? key.length : "undefined");
        process.exit(1);
    }

    const deployer = signers[0];
    console.log("Deploying contracts with the account:", deployer.address);

    const autoChess = await ethers.deployContract("AutoChessPrivate");
    await autoChess.waitForDeployment();

    console.log(`AutoChessPrivate deployed to ${autoChess.target}`);

    // Save deployment info to frontend
    const deploymentDir = path.join(__dirname, "../../fhe-auto-chess-3d/deployments");
    if (!fs.existsSync(deploymentDir)) {
        fs.mkdirSync(deploymentDir, { recursive: true });
    }

    const artifact = await artifacts.readArtifact("AutoChessPrivate");

    const deploymentData = {
        address: autoChess.target,
        abi: artifact.abi,
        network: "hardhat" // Update this based on your network
    };

    const deploymentFile = path.join(deploymentDir, "AutoChessPrivate.json");
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentData, null, 2));
    console.log(`Deployment data saved to ${deploymentFile}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
