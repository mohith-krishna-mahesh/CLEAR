/**
 * Injects deployed contract addresses from besu-local.json into subgraph.yaml
 * and ensures shared ABIs are synced.
 */
const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "../..");
const DEPLOYMENT_PATH = path.join(
  ROOT_DIR,
  "contracts/deployments/besu-local.json",
);
const SUBGRAPH_YAML_PATH = path.join(ROOT_DIR, "subgraph/subgraph.yaml");
const SHARED_ABI_DIR = path.join(ROOT_DIR, "shared/abi");

// Ensure shared/abi directory exists
if (!fs.existsSync(SHARED_ABI_DIR)) {
  fs.mkdirSync(SHARED_ABI_DIR, { recursive: true });
}

// 1. Sync ABIs from Hardhat artifacts if present
const dirArtifact = path.join(
  ROOT_DIR,
  "contracts/artifacts/contracts/RegistryDirectory.sol/RegistryDirectory.json",
);
const setArtifact = path.join(
  ROOT_DIR,
  "contracts/artifacts/contracts/CLEARSettlement.sol/CLEARSettlement.json",
);

if (fs.existsSync(dirArtifact)) {
  const dirData = JSON.parse(fs.readFileSync(dirArtifact, "utf8"));
  fs.writeFileSync(
    path.join(SHARED_ABI_DIR, "RegistryDirectory.json"),
    JSON.stringify(dirData.abi, null, 2),
  );
  console.log(
    "[inject-addresses] Synced RegistryDirectory.json ABI to shared/abi/",
  );
}

if (fs.existsSync(setArtifact)) {
  const setData = JSON.parse(fs.readFileSync(setArtifact, "utf8"));
  fs.writeFileSync(
    path.join(SHARED_ABI_DIR, "CLEARSettlement.json"),
    JSON.stringify(setData.abi, null, 2),
  );
  console.log(
    "[inject-addresses] Synced CLEARSettlement.json ABI to shared/abi/",
  );
}

// 2. Read deployment addresses or fall back to environment / defaults
let dirAddress =
  process.env.DIRECTORY_CONTRACT_ADDRESS ||
  "0x0000000000000000000000000000000000000000";
let setAddress =
  process.env.SETTLEMENT_CONTRACT_ADDRESS ||
  "0x0000000000000000000000000000000000000000";

if (fs.existsSync(DEPLOYMENT_PATH)) {
  try {
    const deployment = JSON.parse(fs.readFileSync(DEPLOYMENT_PATH, "utf8"));
    if (deployment.RegistryDirectory?.address) {
      dirAddress = deployment.RegistryDirectory.address;
    }
    if (deployment.CLEARSettlement?.address) {
      setAddress = deployment.CLEARSettlement.address;
    }
    console.log(
      `[inject-addresses] Loaded deployed addresses from ${DEPLOYMENT_PATH}`,
    );
  } catch (err) {
    console.warn(
      `[inject-addresses] Warning: could not parse ${DEPLOYMENT_PATH}: ${err.message}`,
    );
  }
} else {
  console.log(
    `[inject-addresses] Deployment record ${DEPLOYMENT_PATH} not found yet; using current/default addresses.`,
  );
}

console.log(`[inject-addresses] RegistryDirectory: ${dirAddress}`);
console.log(`[inject-addresses] CLEARSettlement:   ${setAddress}`);

// 3. Update subgraph.yaml
if (fs.existsSync(SUBGRAPH_YAML_PATH)) {
  let yamlContent = fs.readFileSync(SUBGRAPH_YAML_PATH, "utf8");

  // Regex to replace address under RegistryDirectory
  yamlContent = yamlContent.replace(
    /(name:\s*RegistryDirectory[\s\S]*?source:\s*\n\s*address:\s*")[^"]*(")/,
    `$1${dirAddress}$2`,
  );

  // Regex to replace address under CLEARSettlement
  yamlContent = yamlContent.replace(
    /(name:\s*CLEARSettlement[\s\S]*?source:\s*\n\s*address:\s*")[^"]*(")/,
    `$1${setAddress}$2`,
  );

  fs.writeFileSync(SUBGRAPH_YAML_PATH, yamlContent, "utf8");
  console.log(`[inject-addresses] Successfully updated ${SUBGRAPH_YAML_PATH}`);
} else {
  console.error(`[inject-addresses] Error: ${SUBGRAPH_YAML_PATH} not found.`);
  process.exit(1);
}
