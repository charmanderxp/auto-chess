# Documentation Collection

_Exported: 08:18:07 24/11/2025_

_Total pages: 64_

---

## 1. Welcome | Protocol

_Source: https://docs.zama.org/protocol_

Copy
Welcome

Welcome to the Zama Confidential Blockchain Protocol Docs.
The docs aim to guide you to build confidential dApps on top of any L1 or L2 using Fully Homomorphic Encryption (FHE).

Where to go next

If you're completely new to FHE or the Zama Protocol, we suggest first checking out the Litepaper, which offers a thorough overview of the protocol.

Otherwise:

🟨 Go to Quick Start to learn how to write your first confidential smart contract using FHEVM.

🟨 Go to Solidity Guides to explore how encrypted types, operations, ACLs, and other core features work in practice.

🟨 Go to Relayer SDK Guides to build a frontend that can encrypt, decrypt, and interact securely with the blockchain.

🟨 Go to FHE on Blockchain to learn the architecture in depth and understand how encrypted computation flows through both on-chain and off-chain components.

🟨 Go to Examples to find reference and inspiration from smart contract examples and dApp examples.

The Zama Protocol Testnet is not audited and is not intended for production use. Do not publish any critical or sensitive data. For production workloads, please wait for the Mainnet release.

Help center

Ask technical questions and discuss with the community.

Community forum

Discord channel

Last updated 2 months ago

---

## 2. FHE on blockchain | Protocol

_Source: https://docs.zama.org/protocol/protocol/overview_

Copy
PROTOCOL
FHE on blockchain

This section explains in depth the Zama Confidential Blockchain Protocol (Zama Protocol) and demonstrates how it can bring encrypted computation to smart contracts using Fully Homomorphic Encryption (FHE).

FHEVM is the core technology that powers the Zama Protocol. It is composed of the following key components.

FHEVM Solidity library: Enables developers to write confidential smart contracts in plain Solidity using encrypted data types and operations.

Host contracts : Trusted on-chain contracts deployed on EVM-compatible blockchains. They manage access control and trigger off-chain encrypted computation.

Coprocessors – Decentralized services that verify encrypted inputs, run FHE computations, and commit results.

Gateway – The central orchestrator of the protocol. It validates encrypted inputs, manages access control lists (ACLs), bridges ciphertexts across chains, and coordinates coprocessors and the KMS.

Key Management Service (KMS) – A threshold MPC network that generates and rotates FHE keys, and handles secure, verifiable decryption.

Relayer & oracle – A lightweight off-chain service that helps users interact with the Gateway by forwarding encryption or decryption requests.

Previous
Welcome
Next
FHE library

Last updated 20 days ago

---

## 3. FHE library | Protocol

_Source: https://docs.zama.org/protocol/protocol/overview/library_

Copy
PROTOCOL
FHE ON BLOCKCHAIN
FHE library

This document offers a high-level overview of the FHEVM library, helping you understand how it fits into the broader Zama Protocol. To learn how to use it in practice, see the Solidity Guides.

What is FHEVM library?

The FHEVM library enables developers to build smart contracts that operate on encrypted data—without requiring any knowledge of cryptography.

It extends the standard Solidity development flow with:

Encrypted data types

Arithmetic, logical, and conditional operations on encrypted values

Fine-grained access control

Secure input handling and attestation support

This library serves as an abstraction layer over Fully Homomorphic Encryption (FHE) and interacts seamlessly with off-chain components such as the Coprocessors and the Gateway.

Key features
Encrypted data types

The library introduces encrypted variants of common Solidity types, implemented as user-defined value types. Internally, these are represented as bytes32 handles that point to encrypted values stored off-chain.

Category
Types

Booleans

ebool

Unsigned integers

euint8, euint16, ..., euint256

Signed integers

eint8, eint16, ..., eint256

Addresses

eaddress

→ See the full guide of Encrypted data types.

FHE operations

Each encrypted type supports operations similar to its plaintext counterpart:

Arithmetic: add, sub, mul, div, rem, neg

Logic: and, or, xor, not

Comparison: lt, gt, le, ge, eq, ne, min, max

Bit manipulation: shl, shr, rotl, rotr

These operations are symbolically executed on-chain by generating new handles and emitting events for coprocessors to process the actual FHE computation off-chain.

Example:

Copy
function compute(euint64 x, euint64 y, euint64 z) public returns (euint64) {

  euint64 result = FHE.mul(FHE.add(x, y), z);

  return result;

}

→ See the full guide of Operations on encrypted types.

Branching with encrypted Conditions

Direct if or require statements are not compatible with encrypted booleans. Instead, the library provides a selectoperator to emulate conditional logic without revealing which branch was taken:

Copy
ebool condition = FHE.lte(x, y);

euint64 result = FHE.select(condition, valueIfTrue, valueIfFalse);

This preserves confidentiality even in conditional logic.

→ See the full guide of Branching.

Handling external encrypted inputs

When users want to pass encrypted inputs (e.g., values they’ve encrypted off-chain or bridged from another chain), they provide:

external values

A list of coprocessor signatures (attestation)

The function fromExternal is used to validate the attestation and extract a usable encrypted handle:

Copy
function handleInput(externalEuint64 param1, externalEbool param2, bytes calldata attestation) public {

  euint64 val = FHE.fromExternal(param1, attestation);

  ebool flag = FHE.fromExternal(param2, attestation);

}

This ensures that only authorized, well-formed ciphertexts are accepted by smart contracts.

→ See the full guide of Encrypted input.

Access control

The FHE library also exposes methods for managing access to encrypted values using the ACL maintained by host contracts:

allow(handle, address): Grant persistent access

allowTransient(handle, address): Grant access for the current transaction only

allowForDecryption(handle): Make handle publicly decryptable

isAllowed(handle, address): Check if address has access

isSenderAllowed(handle): Shortcut for checking msg.sender permissions

These allow methods emit events consumed by the coprocessors to replicate the ACL state in the Gateway.

→ See the full guide of ACL.

Pseudo-random encrypted values

The library allows generation of pseudo-random encrypted integers, useful for games, lotteries, or randomized logic:

randEuintXX()

randEuintXXBounded(uint bound)

These are deterministic across coprocessors and indistinguishable to external observers.

→ See the full guide of Generate random number.

Previous
FHE on blockchain
Next
Host contracts

Last updated 4 months ago

---

## 4. Host contracts | Protocol

_Source: https://docs.zama.org/protocol/protocol/overview/hostchain_

Copy
PROTOCOL
FHE ON BLOCKCHAIN
Host contracts

This document explains one of the key components of the Zama Protocol - Host contracts.

What are host contracts?

Host contracts are smart contracts deployed on any supported blockchain (EVM or non-EVM) that act as trusted bridges between on-chain applications and the FHEVM protocol. They serve as the minimal and foundational interface that confidential smart contracts use to:

Interact with encrypted data (handles)

Perform access control operations

Emit events for the off-chain components (coprocessors, Gateway)

These host contracts are used indirectly by developers via the FHEVM Solidity library, abstracting away complexity and integrating smoothly into existing workflows.

Responsibilities of host contracts
Trusted interface layer

Host contracts are the only on-chain components that:

Maintain and enforce Access Control Lists (ACLs) for ciphertexts.

Emit events that trigger coprocessor execution.

Validate access permissions (persistent, transient, or decryption-related).

They are effectively the on-chain authority for:

Who is allowed to access a ciphertext

When and how they can use it

These ACLs are mirrored on the Gateway for off-chain enforcement and bridging.

Access Control API

Host contracts expose access control logic via standardized function calls (wrapped by the FHEVM library):

allow(handle, address): Grants persistent access.

allowTransient(handle, address): Grants temporary access for a single transaction.

allowForDecryption(handle): Marks a handle as publicly decryptable.

isAllowed(handle, address): Returns whether a given address has access.

isSenderAllowed(handle): Checks if msg.sender is allowed to use a handle.

They also emit:

Allowed(handle, address)

AllowedForDecryption(handle)

These events are crucial for triggering coprocessor state updates and ensuring proper ACL replication to the Gateway.

→ See the full guide of ACL.

Security role

Although the FHE computation happens off-chain, host contracts play a critical role in protocol security by:

Enforcing ACL-based gating

Ensuring only authorized contracts and users can decrypt or use a handle

Preventing misuse of encrypted data (e.g., computation without access)

Access attempts without proper authorization are rejected at the smart contract level, protecting both the integrity of confidential operations and user privacy.

Previous
FHE library
Next
Coprocessor

Last updated 4 months ago

---

## 5. Coprocessor | Protocol

_Source: https://docs.zama.org/protocol/protocol/overview/coprocessor_

Copy
PROTOCOL
FHE ON BLOCKCHAIN
Coprocessor

This document explains one of the key components of the Zama Protocol - Coprocessor, the Zama Protocol’s off-chain computation engine.

What is the Coprocessor?

Coprocessor performs the heavy cryptographic operations—specifically, fully homomorphic encryption (FHE) computations—on behalf of smart contracts that operate on encrypted data. Acting as a decentralized compute layer, the coprocessor bridges symbolic on-chain logic with real-world encrypted execution.

Coprocessor works together with the Gateway, verifying encrypted inputs, executing FHE instructions, and maintaining synchronization of access permissions, in particular:

Listens to events emitted by host chains and the Gateway.

Executes FHE computations (add, mul, div, cmp, etc.) on ciphertexts.

Validates encrypted inputs and ZK proofs of correctness.

Maintains and updates a replica of the host chain’s Access Control Lists (ACLs).

Stores and serves encrypted data for decryption or bridging.

Each coprocessor independently executes tasks and publishes verifiable results, enabling a publicly auditable and horizontally scalable confidential compute infrastructure .

Responsibilities of the Coprocessor
Encrypted input verification

When users submit encrypted values to the Gateway, each coprocessor:

Verifies the associated Zero-Knowledge Proof of Knowledge (ZKPoK).

Extracts and unpacks individual ciphertexts from a packed submission.

Stores the ciphertexts under derived handles.

Signs the verified handles, embedding user and contract metadata.

Sends the signed data back to the Gateway for consensus.

This ensures only valid, well-formed encrypted values enter the system .

FHE computation execution

When a smart contract executes a function over encrypted values, the on-chain logic emits symbolic computation events.
Each coprocessor:

Reads these events from the host chain node it runs.

Fetches associated ciphertexts from its storage.

Executes the required FHE operations using the TFHE-rs library (e.g., add, mul, select).

Stores the resulting ciphertext under a deterministically derived handle.

Optionally publishes a commitment (digest) of the ciphertext to the Gateway for verifiability.

This offloads expensive computation from the host chain while maintaining full determinism and auditability .

ACL replication

Coprocessors replicate the Access Control List (ACL) logic from host contracts. They:

Listen to Allowed and AllowedForDecryption events.

Push updates to the Gateway.

This ensures decentralized enforcement of access rights, enabling proper handling of decryptions, bridges, and contract interactions .

Ciphertext commitment

To ensure verifiability and mitigate misbehavior, each coprocessor:

Commits to ciphertext digests (via hash) when processing Allowed events.

Publishes these commitments to the Gateway.

Enables external verification of FHE computations.

This is essential for fraud-proof mechanisms and eventual slashing of malicious or faulty operators .

Bridging & decryption support

Coprocessors assist in:

Bridging encrypted values between host chains by generating new handles and signatures.

Preparing ciphertexts for public and user decryption using operations like Switch-n-Squash to normalize ciphertexts for the KMS.

These roles help maintain cross-chain interoperability and enable privacy-preserving data access for users and smart contracts .

Security and trust assumptions

Coprocessors are designed to be minimally trusted and publicly verifiable. Every FHE computation or input verification they perform is accompanied by a cryptographic commitment (hash digest) and a signature, allowing anyone to independently verify correctness.

The protocol relies on a majority-honest assumption: as long as more than 50% of coprocessors are honest, results are valid. The Gateway aggregates responses and accepts outputs only when a majority consensus is reached.

To enforce honest behavior, coprocessors must stake $ZAMA tokens and are subject to slashing if caught misbehaving—either through automated checks or governance-based fraud proofs.

This model ensures correctness through transparency, resilience through decentralization, and integrity through economic incentives.

Architecture & Scalability

The coprocessor architecture includes:

Event listeners for host chains and the Gateway

A task queue for FHE and ACL update jobs

Worker threads that process tasks in parallel

A public storage layer (e.g., S3) for ciphertext availability

This modular setup supports horizontal scaling: adding more workers or machines increases throughput. Symbolic computation and delayed execution also ensure low gas costs on-chain .

Previous
Host contracts
Next
Gateway

Last updated 20 days ago

---

## 6. Gateway | Protocol

_Source: https://docs.zama.org/protocol/protocol/overview/gateway_

Copy
PROTOCOL
FHE ON BLOCKCHAIN
Gateway

This document explains one of the key components of the Zama Protocol - Gateway, the central orchestrator within Zama’s FHEVM protocol, coordinates interactions between users, host chains, coprocessors, and the Key Management Service (KMS), ensuring that encrypted data flows securely and correctly through the system.

What is the Gateway?

The Gateway is a specialized blockchain component (implemented as an Arbitrum rollup) responsible for managing:

Validation of encrypted inputs from users and applications.

Bridging of encrypted ciphertexts across different blockchains.

Decryption orchestration via KMS nodes.

Consensus enforcement among decentralized coprocessors.

Staking and reward distribution to operators participating in FHE computations.

It is designed to be trust-minimized: computations are independently verifiable, and no sensitive data or decryption keys are stored on the Gateway itself.

Responsibilities of the Gateway
Encrypted input validation

The Gateway ensures that encrypted values provided by users are well-formed and valid. It does this by:

Accepting encrypted inputs along with Zero-Knowledge Proofs of Knowledge (ZKPoKs).

Emitting verification events for coprocessors to validate.

Aggregating signatures from a majority of coprocessors to generate attestations, which can then be used on-chain as trusted external values.

Access Control coordination

The Gateway maintains a synchronized copy of Access Control Lists (ACLs) from host chains, enabling it to independently determine if decryption or computation rights should be granted for a ciphertext. This helps enforce:

Access permissions (allow)

Public decryption permissions (allowForDecryption)

These ACL updates are replicated by coprocessors and pushed to the Gateway for verification and enforcement.

Decryption orchestration

When a smart contract or user requests the decryption of an encrypted value:

The Gateway verifies ACL permissions.

It then triggers the KMS to decrypt (either publicly or privately).

Once the KMS returns signed results, the Gateway emits events that can be picked up by an oracle (for smart contract decryption) or returned to the user (for private decryption).

This ensures asynchronous, secure, and auditable decryption without the Gateway itself knowing the plaintext.

Cross-chain bridging

The Gateway also handles bridging of encrypted handles between host chains. It:

Verifies access rights on the source chain using its ACL copy.

Requests the coprocessors to compute new handles for the target chain.

Collects signatures from coprocessors.

Issues attestations allowing these handles to be used on the destination chain.

Consensus and slashing enforcement

The Gateway enforces consensus across decentralized coprocessors and KMS nodes. If discrepancies occur:

Coprocessors must provide commitments to ciphertexts.

Fraudulent or incorrect behavior can be challenged and slashed.

Governance mechanisms can be triggered for off-chain verification when necessary.

Protocol administration

The Gateway runs smart contracts that administer:

Operator and participant registration (coprocessors, KMS nodes, host chains)

Key management and rotation

Bridging logic

Input validation and decryption workflows

Security and trust assumptions

The Gateway is designed to operate without requiring trust:

It does not perform any computation itself—it merely orchestrates and validates.

All actions are signed, and cryptographic verification is built into every step.

The protocol assumes no trust in the Gateway for security guarantees—it can be fully audited and replaced if necessary.

Previous
Coprocessor
Next
KMS

Last updated 20 days ago

---

## 7. KMS | Protocol

_Source: https://docs.zama.org/protocol/protocol/overview/kms_

Copy
PROTOCOL
FHE ON BLOCKCHAIN
KMS

This document explains one of the key components of the Zama Protocol - The Key Management Service (KMS), responsible for the secure generation, management, and usage of FHE keys needed to enable confidential smart contracts.

What is the KMS?

The KMS is a decentralized network of several nodes (also called "parties") that run an MPC (Multi-Party Computation) protocol:

Securely generate global FHE keys

Decrypt ciphertexts securely for public and user-targeted decryptions

Support zero-knowledge proof infrastructure

Manage key lifecycles with NIST compliance

It works entirely off-chain, but is orchestrated through the Gateway, which initiates and tracks all key-related operations. This separation of powers ensures strong decentralization and auditability.

Key responsibilities
FHE threshold key generation

The KMS securely generates a global public/private key pair used across all host chains.

This key enables composability — encrypted data can be shared between contracts and chains.

The private FHE key is never directly accessible by a single party; instead, it is secret-shared among the MPC nodes.

The system follows the NIST SP 800-57 key lifecycle model, managing key states such as Active, Suspended, Deactivated,and Destroyed to ensure proper rotation and forward security.

Threshold Decryption via MPC

The KMS performs decryption using a threshold decryption protocol — at least a minimum number of MPC parties (e.g., 9 out of 13) must participate in the protocol to robustly decrypt a value.

This protects against compromise: no individual party has access to the full key. And adversary would need to control more than the threshold of KMS nodes to influence the system.

The protocol supports both:

Public decryption (e.g., for smart contracts)

User decryption (privately returned, re-encrypted only for the user to access)

All decryption operation outputs are signed by each node and the output can be verified on-chain for full auditability.

ZK Proof support

The KMS generates Common Reference Strings (CRS) needed to validate Zero-Knowledge Proofs of Knowledge (ZKPoK) when users submit encrypted values.

This ensures encrypted inputs are valid and well-formed, and that a user has knowledge of the plaintext contained in the submitted input ciphertext.

Security architecture
MPC-based key sharing

The KMS currently uses 13 MPC nodes, operated by different reputable organizations.

Private keys are split using threshold secret sharing.

Communication between nodes are secured using mTLS with gRPC.

Honest majority assumption

The protocol is robust against malicious actors as long as at most 1/3 of the nodes act maliciously.

It supports guaranteed output delivery even if some nodes are offline or misbehaving.

Secure execution environments

Each MPC node runs by default inside an AWS Nitro Enclave, a secure execution environment that prevents even node operators from accessing their own key shares. This design mitigates insider risks, such as unauthorized key reconstruction or selling of shares.

Auditable via gateway

All operations are broadcast through the Gateway and recorded as blockchain events.

KMS responses are signed, allowing smart contracts and users to verify results cryptographically.

Key lifecycle management

The KMS adheres to a formal key lifecycle, as per NIST SP 800-57:

State
Description

Pre-activation

Key is created but not in use.

Active

Key is used for encryption and decryption.

Suspended

Temporarily replaced during rotation. Still usable for decryption.

Deactivated

Archived; only used for decryption.

Compromised

Flagged for misuse; only decryption allowed.

Destroyed

Key material is deleted permanently.

The KMS supports key switching using FHE, allowing ciphertexts to be securely transferred between keys during rotation. This maintains interoperability across key updates.

Backup & recovery

In addition to robustness through MPC, the KMS also offers a custodial backup system:

Each MPC node splits its key share into encrypted fragments, distributing them to independent custodians.

If a share is lost, a quorum of custodians can collaboratively restore it, ensuring recovery even if several MPC nodes are offline.

This approach guarantees business continuity and resilience against outages.

All recovery operations require a quorum of operators and are fully auditable on-chain.

Workflow example: Public decryption

A smart contract requests decryption via an oracle.

The Gateway verifies permissions (i.e. that the contract is allowed to decrypt the ciphertext) and emits an event.

KMS parties retrieve the ciphertext, verify it, and run the MPC decryption protocol to jointly compute the plaintext and sign their result.

Once a quorum agrees on the plaintext result, it is published (with signatures).

The oracle posts the plaintext back on-chain and contracts can verify the authenticity using the KMS signatures.

Previous
Gateway
Next
Relayer & Oracle

Last updated 4 months ago

---

## 8. Relayer & Oracle | Protocol

_Source: https://docs.zama.org/protocol/protocol/overview/relayer_oracle_

Copy
PROTOCOL
FHE ON BLOCKCHAIN
Relayer & Oracle

This document explains the service interface of the Zama Protocol - Relayer & Oracle.

What is the Oracle?

The Oracle is an off-chain service that acts on behalf of smart contracts to retrieve decrypted values from the FHEVM protocol.

While the FHEVM protocol’s core components handle encryption, computation, and key management, Oracles and Relayers provide the necessary connectivity between users, smart contracts, and the off-chain infrastructure. They act as lightweight services that interface with the Gateway, enabling smooth interaction with encrypted values—without requiring users or contracts to handle complex integration logic.

These components are not part of the trusted base of the protocol; their actions are fully verifiable, and their misbehavior does not compromise confidentiality or correctness.

Responsibilities of the Oracle

Listen for on-chain decryption requests from contracts.

Forward decryption requests to the Gateway on behalf of the contract.

Wait for the KMS to produce signed plaintexts via the Gateway.

Call back the contract on the host chain, passing the decrypted result.

Since the decrypted values are signed by the KMS, the receiving smart contract can verify the result, removing any needto trust the oracle itself.

Security model of the Oracle

Oracles are untrusted: they can only delay a request, not falsify it.

All results are signed and verifiable on-chain.

If one oracle fails to respond, another can take over.

Goal: Enable contracts to access decrypted values asynchronously and securely, without embedding decryption logic.

What is the Relayer?

The Relayer is a user-facing service that simplifies interaction with the Gateway, particularly for encryption and decryption operations that need to happen off-chain.

Responsibilities of the Relayer

Send encrypted inputs from the user to the Gateway for registration.

Initiate user-side decryption requests, including EIP-712 authentication.

Collect the response from the KMS, re-encrypted under the user’s public key.

Deliver the ciphertext back to the user, who decrypts it locally in their browser/app.

This allows users to interact with encrypted smart contracts without having to run their own Gateway interface,
validator, or FHE tooling.

Security model of the Relayer

Relayers are stateless and untrusted.

All data flows are signed and auditable by the user.

Users can always run their own relayer or interact with the Gateway directly if needed.

Goal: Make it easy for users to submit encrypted inputs and retrieve private decrypted results without managing infrastructure.

How they fit in

Smart contracts use the Oracle to receive plaintext results of encrypted computations via callbacks.

Users rely on the Relayer to push encrypted values into the system and fetch personal decrypted results, all backed by EIP-712 signatures and FHE key re-encryption.

Together, Oracles and Relayers help bridge the gap between encrypted execution and application usability—without compromising security or decentralization.

Previous
KMS
Next
Roadmap

Last updated 20 days ago

---

## 9. Roadmap | Protocol

_Source: https://docs.zama.org/protocol/protocol/roadmap_

Copy
PROTOCOL
Roadmap

This document gives a preview of the upcoming features of FHEVM. In addition to what's listed here, you can submit your feature request on GitHub.

Features
Name
Description
ETA

Foundry template

Forge

Q1 '25

Operations
Name
Function name
Type
ETA

Signed Integers

eintX

Coming soon

Add w/ overflow check

FHE.safeAdd

Binary, Decryption

Coming soon

Sub w/ overflow check

FHE.safeSub

Binary, Decryption

Coming soon

Mul w/ overflow check

FHE.safeMul

Binary, Decryption

Coming soon

Random signed int

FHE.randEintX()

Random

-

Div

FHE.div

Binary

-

Rem

FHE.rem

Binary

-

Set inclusion

FHE.isIn()

Binary

-

Random encrypted integers that are generated fully on-chain. Currently, implemented as a mockup by using a PRNG in the plain. Not for use in production!

Previous
Relayer & Oracle
Next
Contributing

Last updated 20 days ago

---

## 10. Overview | Solidity Guides | Protocol

_Source: https://docs.zama.org/protocol/solidity-guides_

Copy
Overview

Welcome to Solidity Guides!

This section will guide you through writing confidential smart contracts in Solidity using the FHEVM library. With Fully Homomorphic Encryption(FHE), your contracts can operate directly on encrypted data without ever decrypting it onchain.

Where to go next

If you’re new to the Zama Protocol, start with the Litepaper or the Protocol Overview to understand the foundations.

Otherwise:

🟨 Go to What is FHEVM to learn about the core concepts and features.

🟨 Go to Quick Start Tutorial to build and test your first confidential smart contract.

🟨 Go to Smart Contract Guides for details on encrypted types, supported operations, inputs, ACL, and decryption flows.

🟨 Go to Development Guides to set up your local environment with Hardhat or Foundry and deploy FHEVM contracts.

🟨 Go to Migration Guide if you're upgrading from a previous version to v0.7.

Help center

Ask technical questions and discuss with the community.

Community forum

Discord channel

Next
What is FHEVM Solidity

Last updated 1 month ago

---

## 11. What is FHEVM Solidity | Solidity Guides | Protocol

_Source: https://docs.zama.org/protocol/solidity-guides/getting-started/overview_

Copy
GETTING STARTED
What is FHEVM Solidity

This document provides an overview of key features of the FHEVM smart contract library.

Configuration and initialization

Smart contracts using FHEVM require proper configuration and initialization:

Environment setup: Import and inherit from environment-specific configuration contracts

Relayer configuration: Configure secure relayer access for cryptographic operations

Initialization checks: Validate encrypted variables are properly initialized before use

For more information see Configuration.

Encrypted data types

FHEVM introduces encrypted data types compatible with Solidity:

Booleans: ebool

Unsigned Integers: euint8, euint16, euint32, euint64, euint128, euint256

Addresses: eaddress

Input: externalEbool, externalEaddress, externalEuintXX for handling encrypted input data

Encrypted data is represented as ciphertext handles, ensuring secure computation and interaction.

For more information see use of encrypted types.

Casting types

fhevm provides functions to cast between encrypted types:

Casting between encrypted types: FHE.asEbool converts encrypted integers to encrypted booleans

Casting to encrypted types: FHE.asEuintX converts plaintext values to encrypted types

Casting to encrypted addresses: FHE.asEaddress converts plaintext addresses to encrypted addresses

For more information see use of encrypted types.

Confidential computation

fhevm enables symbolic execution of encrypted operations, supporting:

Arithmetic: FHE.add, FHE.sub, FHE.mul, FHE.min, FHE.max, FHE.neg, FHE.div, FHE.rem

Note: div and rem operations are supported only with plaintext divisors

Bitwise: FHE.and, FHE.or, FHE.xor, FHE.not, FHE.shl, FHE.shr, FHE.rotl, FHE.rotr

Comparison: FHE.eq, FHE.ne, FHE.lt, FHE.le, FHE.gt, FHE.ge

Advanced: FHE.select for branching on encrypted conditions, FHE.randEuintX for on-chain randomness.

For more information on operations, see Operations on encrypted types.

For more information on conditional branching, see Conditional logic in FHE.

For more information on random number generation, see Generate Random Encrypted Numbers.

Access control mechanism

fhevm enforces access control with a blockchain-based Access Control List (ACL):

Persistent access: FHE.allow, FHE.allowThis grants permanent permissions for ciphertexts.

Transient access: FHE.allowTransient provides temporary access for specific transactions.

Validation: FHE.isSenderAllowed ensures that only authorized entities can interact with ciphertexts.

Persistent public decryption: FHE.makePubliclyDecryptable, FHE.isPubliclyDecryptable makes a given ciphertext permanently publicly decryptable.

For more information see ACL.

Previous
Overview
Next
Set up Hardhat

Last updated 5 days ago

---

## 12. Set up Hardhat | Solidity Guides | Protocol

_Source: https://docs.zama.org/protocol/solidity-guides/getting-started/setup_

Copy
GETTING STARTED
Set up Hardhat

In this section, you’ll learn how to set up a FHEVM Hardhat development environment using the FHEVM Hardhat template as a starting point for building and testing fully homomorphic encrypted smart contracts.

Create a local Hardhat Project
1
Install a Node.js TLS version

Ensure that Node.js is installed on your machine.

Download and install the recommended LTS (Long-Term Support) version from the official website.

Use an even-numbered version (e.g., v18.x, v20.x)

Hardhat does not support odd-numbered Node.js versions. If you’re using one (e.g., v21.x, v23.x), Hardhat will display a persistent warning message and may behave unexpectedly.

To verify your installation:

Copy
node -v

npm -v
2
Create a new GitHub repository from the FHEVM Hardhat template.

On GitHub, navigate to the main page of the FHEVM Hardhat template repository.

Above the file list, click the green Use this template button.

Follow the instructions to create a new repository from the FHEVM Hardhat template.

See Github doc: Creating a repository from a template

3
Clone your newly created GitHub repository locally

Now that your GitHub repository has been created, you can clone it to your local machine:

Copy
cd <your-preferred-location>

git clone <url-to-your-new-repo>



# Navigate to the root of your new FHEVM Hardhat project

cd <your-new-repo-name>

Next, let’s install your local Hardhat development environment.

4
Install your FHEVM Hardhat project dependencies

From the project root directory, run:

Copy
npm install

This will install all required dependencies defined in your package.json, setting up your local FHEVM Hardhat development environment.

5
Set up the Hardhat configuration variables (optional)

If you do plan to deploy to the Sepolia Ethereum Testnet, you'll need to set up the following Hardhat Configuration variables.

MNEMONIC

A mnemonic is a 12-word seed phrase used to generate your Ethereum wallet keys.

Get one by creating a wallet with MetaMask, or using any trusted mnemonic generator.

Set it up in your Hardhat project:

Copy
npx hardhat vars set MNEMONIC

INFURA_API_KEY

The INFURA project key allows you to connect to Ethereum testnets like Sepolia.

Obtain one by following the Infura + MetaMask setup guide.

Configure it in your project:

Copy
npx hardhat vars set INFURA_API_KEY

Default Values

If you skip this step, Hardhat will fall back to these defaults:

MNEMONIC = "test test test test test test test test test test test junk"

INFURA_API_KEY = "zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz"

These defaults are not suitable for real deployments.

Missing variable error:

If any of the requested Hardhat Configuration Variables is missing, you'll get an error message like this one:Error HH1201: Cannot find a value for the configuration variable 'MNEMONIC'. Use 'npx hardhat vars set MNEMONIC' to set it or 'npx hardhat var setup' to list all the configuration variables used by this project.

Congratulations! You're all set to start building your confidential dApp.

Optional settings
Install VSCode extensions

If you're using Visual Studio Code, there are some extensions available to improve you your development experience:

Prettier - Code formatter by prettier.io — ID:esbenp.prettier-vscode,

ESLint by Microsoft — ID:dbaeumer.vscode-eslint

Solidity support (pick one only):

Solidity by Juan Blanco — ID:juanblanco.solidity

Solidity by Nomic Foundation — ID:nomicfoundation.hardhat-solidity

Reset the Hardhat project

If you'd like to start from a clean slate, you can reset your FHEVM Hardhat project by removing all example code and generated files.

Copy
# Navigate to the root of your new FHEVM Hardhat project

cd <your-new-repo-name>

Then run:

Copy
rm -rf test/* src/* tasks/* deploy ./fhevmTemp ./artifacts ./cache ./coverage ./types ./coverage.json ./dist
Previous
What is FHEVM Solidity
Next
Quick start tutorial

Last updated 1 month ago

---

## 13. Quick start tutorial | Solidity Guides | Protocol

_Source: https://docs.zama.org/protocol/solidity-guides/getting-started/quick-start-tutorial_

Copy
GETTING STARTED
Quick start tutorial

This tutorial guides you to start quickly with Zama’s Fully Homomorphic Encryption (FHE) technology for building confidential smart contracts.

What You’ll Learn

In about 30 minutes, you'll go from a basic Solidity contract to a fully confidential one using FHEVM. Here's what you'll do:

Set up your development environment

Write a simple Solidity smart contract

Convert it into an FHEVM-compatible confidential contract

Test your FHEVM-compatible confidential contract

Prerequisite

A basic understanding of Solidity library and Ethereum.

Some familiarity with Hardhat.

About Hardhat

Hardhat is a development environment for compiling, deploying, testing, and debugging Ethereum smart contracts. It’s widely used in the Ethereum ecosystem.

In this tutorial, we'll introduce the FHEVM hardhat template that provides an easy way to use FHEVM.

Previous
Set up Hardhat
Next
2. Write a simple contract

Last updated 1 month ago

---

## 14. 2. Write a simple contract | Solidity Guides | Protocol

_Source: https://docs.zama.org/protocol/solidity-guides/getting-started/quick-start-tutorial/write_a_simple_contract_

Copy
GETTING STARTED
QUICK START TUTORIAL
2. Write a simple contract

In this tutorial, you'll write and test a simple regular Solidity smart contract within the FHEVM Hardhat template to get familiar with Hardhat workflow.

In the next tutorial, you'll learn how to convert this contract into an FHEVM contract.

Prerequisite

Set up your Hardhat envrionment.

Make sure that you Hardhat project is clean and ready to start. See the instructions here.

What you'll learn

By the end of this tutorial, you will learn to:

Write a minimal Solidity contract using Hardhat.

Test the contract using TypeScript and Hardhat’s testing framework.

Write a simple contract
1
Create Counter.sol

Go to your project's contracts directory:

Copy
cd <your-project-root-directory>/contracts

From there, create a new file named Counter.sol and copy/paste the following Solidity code in it.

Copy
// SPDX-License-Identifier: BSD-3-Clause-Clear

pragma solidity ^0.8.24;



/// @title A simple counter contract

contract Counter {

  uint32 private _count;



  /// @notice Returns the current count

  function getCount() external view returns (uint32) {

    return _count;

  }



  /// @notice Increments the counter by a specific value

  function increment(uint32 value) external {

    _count += value;

  }



  /// @notice Decrements the counter by a specific value

  function decrement(uint32 value) external {

    require(_count >= value, "Counter: cannot decrement below zero");

    _count -= value;

  }

}
2
Compile Counter.sol

From your project's root directory, run:

Copy
npx hardhat compile

Great! Your Smart Contract is now compiled.

Set up the testing environment
1
Create a test script test/Counter.ts

Go to your project's test directory

Copy
cd <your-project-root-directory>/test

From there, create a new file named Counter.ts and copy/paste the following Typescript skeleton code in it.

Copy
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

import { ethers } from "hardhat";



describe("Counter", function () {

  it("empty test", async function () {

    console.log("Cool! The test basic skeleton is running!");

  });

});

The file contains the following:

all the required import statements we will need during the various tests

The chai basic statements to run a first empty test named empty test

2
Run the test test/Counter.ts

From your project's root directory, run:

Copy
npx hardhat test

Output:

Copy
  Counter

Cool! The test basic skeleton is running!

    ✔ empty test





  1 passing (1ms)

Great! Your Hardhat test environment is properly setup.

3
Set up the test signers

Before interacting with smart contracts in Hardhat tests, we need to initialize signers.

In the context of Ethereum development, a signer represents an entity (usually a wallet) that can send transactions and sign messages. In Hardhat, ethers.getSigners() returns a list of pre-funded test accounts.

We’ll define three named signers for convenience:

owner — the deployer of the contract

alice and bob — additional simulated users

Replace the contents of test/Counter.ts with the following:

Copy
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

import { ethers } from "hardhat";



type Signers = {

  owner: HardhatEthersSigner;

  alice: HardhatEthersSigner;

  bob: HardhatEthersSigner;

};



describe("Counter", function () {

  let signers: Signers;



  before(async function () {

    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();

    signers = { owner: ethSigners[0], alice: ethSigners[1], bob: ethSigners[2] };

  });



  it("should work", async function () {

    console.log(`address of user owner is ${signers.owner.address}`);

    console.log(`address of user alice is ${signers.alice.address}`);

    console.log(`address of user bob is ${signers.bob.address}`);

  });

});

Run the test

From your project's root directory, run:

Copy
npx hardhat test

Expected Output

Copy
  Counter

address of user owner is 0x37AC010c1c566696326813b840319B58Bb5840E4

address of user alice is 0xD9F9298BbcD72843586e7E08DAe577E3a0aC8866

address of user bob is 0x3f0CdAe6ebd93F9F776BCBB7da1D42180cC8fcC1

    ✔ should work





  1 passing (2ms)
4
Set up testing instance

Now that we have our signers set up, we can deploy the smart contract.

To ensure isolated and deterministic tests, we should deploy a fresh instance of Counter.sol before each test. This avoids any side effects from previous tests.

The standard approach is to define a deployFixture() function that handles contract deployment.

Copy
async function deployFixture() {

  const factory = (await ethers.getContractFactory("Counter")) as Counter__factory;

  const counterContract = (await factory.deploy()) as Counter;

  const counterContractAddress = await counterContract.getAddress();



  return { counterContract, counterContractAddress };

}

To run this setup before each test case, call deployFixture() inside a beforeEach block:

Copy
beforeEach(async () => {

  ({ counterContract, counterContractAddress } = await deployFixture());

});

This ensures each test runs with a clean, independent contract instance.

Let's put it together. Now yourtest/Counter.ts should look like the following:

Copy
import { Counter, Counter__factory } from "../types";

import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

import { expect } from "chai";

import { ethers } from "hardhat";



type Signers = {

  deployer: HardhatEthersSigner;

  alice: HardhatEthersSigner;

  bob: HardhatEthersSigner;

};



async function deployFixture() {

  const factory = (await ethers.getContractFactory("Counter")) as Counter__factory;

  const counterContract = (await factory.deploy()) as Counter;

  const counterContractAddress = await counterContract.getAddress();



  return { counterContract, counterContractAddress };

}



describe("Counter", function () {

  let signers: Signers;

  let counterContract: Counter;

  let counterContractAddress: Counter;



  before(async function () {

    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();

    signers = { deployer: ethSigners[0], alice: ethSigners[1], bob: ethSigners[2] };

  });



  beforeEach(async () => {

    // Deploy a new instance of the contract before each test

    ({ counterContract, counterContractAddress } = await deployFixture());

  });



  it("should be deployed", async function () {

    console.log(`Counter has been deployed at address ${counterContractAddress}`);

    // Test the deployed address is valid

    expect(ethers.isAddress(counterContractAddress)).to.eq(true);

  });

});

Run the test:

From your project's root directory, run:

Copy
npx hardhat test

Expected Output:

Copy
  Counter

Counter has been deployed at address 0x7553CB9124f974Ee475E5cE45482F90d5B6076BC

    ✔ should be deployed





  1 passing (7ms)
Test functions

Now everything is up and running, you can start testing your contract functions.

1
Call the contract getCount() view function

Everything is up and running, we can now call the Counter.sol view function getCount() !

Just below the test block it("should be deployed", async function () {...},

add the following unit test:

Copy
it("count should be zero after deployment", async function () {

  const count = await counterContract.getCount();

  console.log(`Counter.getCount() === ${count}`);

  // Expect initial count to be 0 after deployment

  expect(count).to.eq(0);

});

Run the test

From your project's root directory, run:

Copy
npx hardhat test

Expected Output

Copy
  Counter

Counter has been deployed at address 0x7553CB9124f974Ee475E5cE45482F90d5B6076BC

    ✔ should be deployed

Counter.getCount() === 0

    ✔ count should be zero after deployment





  1 passing (7ms)
2
Call the contract increment() transaction function

Just below the test block it("count should be zero after deployment", async function () {...}, add the following test block:

Copy
it("increment the counter by 1", async function () {

  const countBeforeInc = await counterContract.getCount();

  const tx = await counterContract.connect(signers.alice).increment(1);

  await tx.wait();

  const countAfterInc = await counterContract.getCount();

  expect(countAfterInc).to.eq(countBeforeInc + 1n);

});

Remarks:

increment() is a transactional function that modifies the blockchain state.

It must be signed by a user — here we use alice.

await wait() to wait for the transaction to mined.

The test compares the counter before and after the transaction to ensure it incremented as expected.

Run the test

From your project's root directory, run:

Copy
npx hardhat test

Expected Output

Copy
  Counter

Counter has been deployed at address 0x7553CB9124f974Ee475E5cE45482F90d5B6076BC

    ✔ should be deployed

Counter.getCount() === 0

    ✔ count should be zero after deployment

    ✔ increment the counter by 1





  2 passing (12ms)
3
Call the contract decrement() transaction function

Just below the test block it("increment the counter by 1", async function () {...},

add the following test block:

Copy
it("decrement the counter by 1", async function () {

  // First increment, count becomes 1

  let tx = await counterContract.connect(signers.alice).increment(1);

  await tx.wait();

  // Then decrement, count goes back to 0

  tx = await counterContract.connect(signers.alice).decrement(1);

  await tx.wait();

  const count = await counterContract.getCount();

  expect(count).to.eq(0);

});

Run the test

From your project's root directory, run:

Copy
npx hardhat test

Expected Output

Copy
  Counter

Counter has been deployed at address 0x7553CB9124f974Ee475E5cE45482F90d5B6076BC

    ✔ should be deployed

Counter.getCount() === 0

    ✔ count should be zero after deployment

    ✔ increment the counter by 1

    ✔ decrement the counter by 1





  2 passing (12ms)

Now you have successfully written and tested your counter contract. You should have the following files in your project:

contracts/Counter.sol — your Solidity smart contract

test/Counter.ts — your Hardhat test suite written in TypeScript

These files form the foundation of a basic Hardhat-based smart contract project.

Next step

Now that you've written and tested a basic Solidity smart contract, you're ready to take the next step.

In the next tutorial, we’ll transform this standard Counter.sol contract into FHECounter.sol, a trivial FHEVM-compatible version — allowing the counter value to be stored and updated using trivial fully homomorphic encryption.

Previous
Quick start tutorial
Next
3. Turn it into FHEVM

Last updated 25 days ago

---

## 15. 3. Turn it into FHEVM | Solidity Guides | Protocol

_Source: https://docs.zama.org/protocol/solidity-guides/getting-started/quick-start-tutorial/turn_it_into_fhevm_

Copy
GETTING STARTED
QUICK START TUTORIAL
3. Turn it into FHEVM

In this tutorial, you'll learn how to take a basic Solidity smart contract and progressively upgrade it to support Fully Homomorphic Encryption using the FHEVM library by Zama.

Starting with the plain Counter.sol contract that you built from the "Write a simple contract" tutorial, and step-by-step, you’ll learn how to:

Replace standard types with encrypted equivalents

Integrate zero-knowledge proof validation

Enable encrypted on-chain computation

Grant permissions for secure off-chain decryption

By the end, you'll have a fully functional smart contract that supports FHE computation.

Initiate the contract
1
Create the FHECounter.sol file

Navigate to your project’s contracts directory:

Copy
cd <your-project-root-directory>/contracts

From there, create a new file named FHECounter.sol, and copy the following Solidity code into it:

Copy
// SPDX-License-Identifier: BSD-3-Clause-Clear

pragma solidity ^0.8.24;



/// @title A simple counter contract

contract Counter {

  uint32 private _count;



  /// @notice Returns the current count

  function getCount() external view returns (uint32) {

    return _count;

  }



  /// @notice Increments the counter by a specific value

  function increment(uint32 value) external {

    _count += value;

  }



  /// @notice Decrements the counter by a specific value

  function decrement(uint32 value) external {

    require(_count >= value, "Counter: cannot decrement below zero");

    _count -= value;

  }

}

This is a plain Counter contract that we’ll use as the starting point for adding FHEVM functionality. We will modify this contract step-by-step to progressively integrate FHEVM capabilities.

2
Turn Counter into FHECounter

To begin integrating FHEVM features into your contract, we first need to import the required FHEVM libraries.

Replace the current header

Copy
// SPDX-License-Identifier: BSD-3-Clause-Clear

pragma solidity ^0.8.24;

With this updated header:

Copy
// SPDX-License-Identifier: BSD-3-Clause-Clear

pragma solidity ^0.8.24;



import { FHE, euint32, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";

import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

These imports:

FHE — the core library to work with FHEVM encrypted types

euint32 and externalEuint32 — encrypted uint32 types used in FHEVM

ZamaEthereumConfig — provides the FHEVM configuration for the Ethereum mainnet or Ethereum Sepolia testnet networks.
Inheriting from it enables your contract to use the FHE library

Replace the current contract declaration:

Copy
/// @title A simple counter contract

contract Counter {

With the updated declaration :

Copy
/// @title A simple FHE counter contract

contract FHECounter is ZamaEthereumConfig {

This change:

Renames the contract to FHECounter

Inherits from ZamaEthereumConfig to enable FHEVM support

This contract must inherit from the ZamaEthereumConfig abstract contract; otherwise, it will not be able to execute any FHEVM-related functionality on Sepolia or Hardhat.

From your project's root directory, run:

Copy
npx hardhat compile

Great! Your smart contract is now compiled and ready to use FHEVM features.

Apply FHE functions and types
1
Comment out the increment() and decrement() Functions

Before we move forward, let’s comment out the increment() and decrement() functions in FHECounter. We'll replace them later with updated versions that support FHE-encrypted operations.

Copy
 /// @notice Increments the counter by a specific value

// function increment(uint32 value) external {

//     _count += value;

// }



/// @notice Decrements the counter by a specific value

// function decrement(uint32 value) external {

//     require(_count >= value, "Counter: cannot decrement below zero");

//     _count -= value;

// }
2
Replace uint32 with the FHEVM euint32 Type

We’ll now switch from the standard Solidity uint32 type to the encrypted FHEVM type euint32.

This enables private, homomorphic computation on encrypted integers.

Replace

Copy
uint32 _count;

and

Copy
function getCount() external view returns (uint32) {

With :

Copy
euint32 _count;

and

Copy
function getCount() external view returns (euint32) {
3
Replace increment(uint32 value) with the FHEVM version increment(externalEuint32 value)

To support encrypted input, we will update the increment function to accept a value encrypted off-chain.

Instead of using a uint32, the new version will accept an externalEuint32, which is an encrypted integer produced off-chain and sent to the smart contract.

To ensure the validity of this encrypted value, we also include a second argument:inputProof, a bytes array containing a Zero-Knowledge Proof of Knowledge (ZKPoK) that proves two things:

The externalEuint32 was encrypted off-chain by the function caller (msg.sender)

The externalEuint32 is bound to the contract (address(this)) and can only be processed by it.

Replace

Copy
 /// @notice Increments the counter by a specific value

// function increment(uint32 value) external {

//     _count += value;

// }

With :

Copy
/// @notice Increments the counter by a specific value

function increment(externalEuint32 inputEuint32, bytes calldata inputProof) external {

  //     _count += value;

}
4
Convert externalEuint32 to euint32

You cannot directly use externalEuint32 in FHE operations. To manipulate it with the FHEVM library, you first need to convert it into the native FHE type euint32.

This conversion is done using:

Copy
FHE.fromExternal(inputEuint32, inputProof);

This method verifies the zero-knowledge proof and returns a usable encrypted value within the contract.

Replace

Copy
/// @notice Increments the counter by a specific value

function increment(externalEuint32 inputEuint32, bytes calldata inputProof) external {

  //     _count += value;

}

With :

Copy
/// @notice Increments the counter by a specific value

function increment(externalEuint32 inputEuint32, bytes calldata inputProof) external {

  euint32 evalue = FHE.fromExternal(inputEuint32, inputProof);

  //     _count += value;

}
5
Convert _count += value into its FHEVM equivalent

To perform the update _count += value in a Fully Homomorphic way, we use the FHE.add() operator. This function allows us to compute the FHE sum of 2 encrypted integers.

Replace

Copy
/// @notice Increments the counter by a specific value

function increment(externalEuint32 inputEuint32, bytes calldata inputProof) external {

  euint32 evalue = FHE.fromExternal(inputEuint32, inputProof);

  //     _count += value;

}

With :

Copy
/// @notice Increments the counter by a specific value

function increment(externalEuint32 inputEuint32, bytes calldata inputProof) external {

  euint32 evalue = FHE.fromExternal(inputEuint32, inputProof);

  _count = FHE.add(_count, evalue);

}

This FHE operation allows the smart contract to process encrypted values without ever decrypting them — a core feature of FHEVM that enables on-chain privacy.

Grant FHE Permissions

This step is critical! You must grant FHE permissions to both the contract and the caller to ensure the encrypted _count value can be decrypted off-chain by the caller. Without these 2 permissions, the caller will not be able to compute the clear result.

To grant FHE permission we will call the FHE.allow() function.

Replace
Copy
/// @notice Increments the counter by a specific value

function increment(externalEuint32 inputEuint32, bytes calldata inputProof) external {

  euint32 evalue = FHE.fromExternal(inputEuint32, inputProof);

  _count = FHE.add(_count, evalue);

}
With :
Copy
/// @notice Increments the counter by a specific value

function increment(externalEuint32 inputEuint32, bytes calldata inputProof) external {

  euint32 evalue = FHE.fromExternal(inputEuint32, inputProof);

  _count = FHE.add(_count, evalue);



  FHE.allowThis(_count);

  FHE.allow(_count, msg.sender);

}

We grant two FHE permissions here — not just one. In the next part of the tutorial, you'll learn why both are necessary.

Convert decrement() to its FHEVM equivalent

Just like with the increment() migration, we’ll now convert the decrement() function to its FHEVM-compatible version.

Replace :

Copy
/// @notice Decrements the counter by a specific value

function decrement(uint32 value) external {

  require(_count >= value, "Counter: cannot decrement below zero");

  _count -= value;

}

with the following :

Copy
/// @notice Decrements the counter by a specific value

/// @dev This example omits overflow/underflow checks for simplicity and readability.

/// In a production contract, proper range checks should be implemented.

function decrement(externalEuint32 inputEuint32, bytes calldata inputProof) external {

  euint32 encryptedEuint32 = FHE.fromExternal(inputEuint32, inputProof);



  _count = FHE.sub(_count, encryptedEuint32);



  FHE.allowThis(_count);

  FHE.allow(_count, msg.sender);

}

The increment() and decrement() functions do not perform any overflow or underflow checks.

Compile FHECounter.sol

From your project's root directory, run:

Copy
npx hardhat compile

Congratulations! Your smart contract is now fully FHEVM-compatible.

Now you should have the following files in your project:

contracts/FHECounter.sol — your Solidity smart FHEVM contract

test/FHECounter.ts — your FHEVM Hardhat test suite written in TypeScript

In the next tutorial, we’ll move on to the TypeScript integration, where you’ll learn how to interact with your newly upgraded FHEVM contract in a test suite.

Previous
2. Write a simple contract
Next
4. Test the FHEVM contract

Last updated 5 days ago

---

## 16. 4. Test the FHEVM contract | Solidity Guides | Protocol

_Source: https://docs.zama.org/protocol/solidity-guides/getting-started/quick-start-tutorial/test_the_fhevm_contract_

Copy
GETTING STARTED
QUICK START TUTORIAL
4. Test the FHEVM contract

In this tutorial, you’ll learn how to migrate a standard Hardhat test suite - from Counter.ts to its FHEVM-compatible version FHECounter.ts — and progressively enhance it to support Fully Homomorphic Encryption using Zama’s FHEVM library.

Set up the FHEVM testing environment
1
Create a test script test/FHECounter.ts

Go to your project's test directory

Copy
cd <your-project-root-directory>/test

From there, create a new file named FHECounter.ts and copy/paste the following Typescript skeleton code in it.

Copy
import { FHECounter, FHECounter__factory } from "../types";

import { FhevmType } from "@fhevm/hardhat-plugin";

import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

import { expect } from "chai";

import { ethers, fhevm } from "hardhat";



type Signers = {

  deployer: HardhatEthersSigner;

  alice: HardhatEthersSigner;

  bob: HardhatEthersSigner;

};



async function deployFixture() {

  const factory = (await ethers.getContractFactory("FHECounter")) as FHECounter__factory;

  const fheCounterContract = (await factory.deploy()) as FHECounter;

  const fheCounterContractAddress = await fheCounterContract.getAddress();



  return { fheCounterContract, fheCounterContractAddress };

}



describe("FHECounter", function () {

  let signers: Signers;

  let fheCounterContract: FHECounter;

  let fheCounterContractAddress: string;



  before(async function () {

    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();

    signers = { deployer: ethSigners[0], alice: ethSigners[1], bob: ethSigners[2] };

  });



  beforeEach(async () => {

    ({ fheCounterContract, fheCounterContractAddress } = await deployFixture());

  });



  it("should be deployed", async function () {

    console.log(`FHECounter has been deployed at address ${fheCounterContractAddress}`);

    // Test the deployed address is valid

    expect(ethers.isAddress(fheCounterContractAddress)).to.eq(true);

  });



  //   it("count should be zero after deployment", async function () {

  //     const count = await counterContract.getCount();

  //     console.log(`Counter.getCount() === ${count}`);

  //     // Expect initial count to be 0 after deployment

  //     expect(count).to.eq(0);

  //   });



  //   it("increment the counter by 1", async function () {

  //     const countBeforeInc = await counterContract.getCount();

  //     const tx = await counterContract.connect(signers.alice).increment(1);

  //     await tx.wait();

  //     const countAfterInc = await counterContract.getCount();

  //     expect(countAfterInc).to.eq(countBeforeInc + 1n);

  //   });



  //   it("decrement the counter by 1", async function () {

  //     // First increment, count becomes 1

  //     let tx = await counterContract.connect(signers.alice).increment();

  //     await tx.wait();

  //     // Then decrement, count goes back to 0

  //     tx = await counterContract.connect(signers.alice).decrement(1);

  //     await tx.wait();

  //     const count = await counterContract.getCount();

  //     expect(count).to.eq(0);

  //   });

});
What’s Different from Counter.ts?

This test file is structurally similar to the original Counter.ts, but it uses the FHEVM-compatible smart contract FHECounter instead of the regular Counter.

– For clarity, the Counter unit tests are included as comments, allowing you to better understand how each part is adapted during the migration to FHEVM.

While the test logic remains the same, this version is now set up to support encrypted computations via the FHEVM library — enabling tests that manipulate confidential values directly on-chain.

2
Run the test test/FHECounter.ts

From your project's root directory, run:

Copy
npx hardhat test

Output:

Copy
  FHECounter

FHECounter has been deployed at address 0x7553CB9124f974Ee475E5cE45482F90d5B6076BC

    ✔ should be deployed





  1 passing (1ms)

Great! Your Hardhat FHEVM test environment is properly setup.

Test functions

Now everything is up and running, you can start testing your contract functions.

1
Call the contract getCount() view function

Replace the commented‐out test for the legacy Counter contract:

Copy
//   it("count should be zero after deployment", async function () {

//     const count = await counterContract.getCount();

//     console.log(`Counter.getCount() === ${count}`);

//     // Expect initial count to be 0 after deployment

//     expect(count).to.eq(0);

//   });

with its FHEVM equivalent:

Copy
it("encrypted count should be uninitialized after deployment", async function () {

  const encryptedCount = await fheCounterContract.getCount();

  // Expect initial count to be bytes32(0) after deployment,

  // (meaning the encrypted count value is uninitialized)

  expect(encryptedCount).to.eq(ethers.ZeroHash);

});

What’s different?

– encryptedCount is no longer a plain TypeScript number. It is now a hexadecimal string representing a Solidity bytes32 value, known as an FHEVM handle. This handle points to an encrypted FHEVM primitive of type euint32, which internally represents an encrypted Solidity uint32 primitive type.

encryptedCount is equal to 0x0000000000000000000000000000000000000000000000000000000000000000 which means that encryptedCount is uninitialized, and does not reference to any encrypted value at this point.

Run the test

From your project's root directory, run:

Copy
npx hardhat test

Expected Output

Copy
  Counter

Counter has been deployed at address 0x7553CB9124f974Ee475E5cE45482F90d5B6076BC

    ✔ should be deployed

    ✔ encrypted count should be uninitialized after deployment





  2 passing (7ms)
2
Setup the increment() function unit test

We’ll migrate the increment() unit test to FHEVM step by step. To start, let’s handle the value of the counter before the first increment. As explained above, the counter is initially a bytes32 value equal to zero, meaning the FHEVM euint32 variable is uninitialized.

We’ll interpret this as if the underlying clear value is 0.

Replace the commented‐out test for the legacy Counter contract:

Copy
//   it("increment the counter by 1", async function () {

//     const countBeforeInc = await counterContract.getCount();

//     const tx = await counterContract.connect(signers.alice).increment(1);

//     await tx.wait();

//     const countAfterInc = await counterContract.getCount();

//     expect(countAfterInc).to.eq(countBeforeInc + 1n);

//   });

with the following:

Copy
it("increment the counter by 1", async function () {

  const encryptedCountBeforeInc = await fheCounterContract.getCount();

  expect(encryptedCountBeforeInc).to.eq(ethers.ZeroHash);

  const clearCountBeforeInc = 0;



  // const tx = await counterContract.connect(signers.alice).increment(1);

  // await tx.wait();

  // const countAfterInc = await counterContract.getCount();

  // expect(countAfterInc).to.eq(countBeforeInc + 1n);

});
3
Encrypt the increment() function argument

The increment() function takes a single argument: the value by which the counter should be incremented. In the initial version of Counter.sol, this value is a clear uint32.

We’ll switch to passing an encrypted value instead, using FHEVM externalEuint32 primitive type. This allows us to securely increment the counter without revealing the input value on-chain.

We are using an externalEuint32 instead of a regular euint32. This tells the FHEVM that the encrypted uint32 was provided externally (e.g., by a user) and must be verified for integrity and authenticity before it can be used within the contract.

Replace :

Copy
it("increment the counter by 1", async function () {

  const encryptedCountBeforeInc = await fheCounterContract.getCount();

  expect(encryptedCountBeforeInc).to.eq(ethers.ZeroHash);

  const clearCountBeforeInc = 0;



  // const tx = await counterContract.connect(signers.alice).increment(1);

  // await tx.wait();

  // const countAfterInc = await counterContract.getCount();

  // expect(countAfterInc).to.eq(countBeforeInc + 1n);

});

with the following:

Copy
it("increment the counter by 1", async function () {

  const encryptedCountBeforeInc = await fheCounterContract.getCount();

  expect(encryptedCountBeforeInc).to.eq(ethers.ZeroHash);

  const clearCountBeforeInc = 0;



  // Encrypt constant 1 as a euint32

  const clearOne = 1;

  const encryptedOne = await fhevm

    .createEncryptedInput(fheCounterContractAddress, signers.alice.address)

    .add32(clearOne)

    .encrypt();



  // const tx = await counterContract.connect(signers.alice).increment(1);

  // await tx.wait();

  // const countAfterInc = await counterContract.getCount();

  // expect(countAfterInc).to.eq(countBeforeInc + 1n);

});

fhevm.createEncryptedInput(fheCounterContractAddress, signers.alice.address) creates an encrypted value that is bound to both the contract (fheCounterContractAddress) and the user (signers.alice.address). This means only Alice can use this encrypted value, and only within the FHECounter.sol contract at that specific address. It cannot be reused by another user or in a different contract, ensuring data confidentiality and binding context-specific encryption.

4
Call the increment() function with the encrypted argument

Now that we have an encrypted argument, we can call the increment() function with it.

Below, you’ll notice that the updated increment() function now takes two arguments instead of one.

This is because the FHEVM requires both:

The externalEuint32 — the encrypted value itself

An accompanying Zero-Knowledge Proof of Knowledge (inputProof) — which verifies that the encrypted input is securely bound to:

the caller (Alice, the transaction signer), and

the target smart contract (where increment() is being executed)

This ensures that the encrypted value cannot be reused in a different context or by a different user, preserving confidentiality and integrity.

Replace :

Copy
// const tx = await counterContract.connect(signers.alice).increment(1);

// await tx.wait();

with the following:

Copy
const tx = await fheCounterContract.connect(signers.alice).increment(encryptedOne.handles[0], encryptedOne.inputProof);

await tx.wait();

At this point the counter has been successfully incremented by 1 using a Fully Homomorphic Encryption (FHE). In the next step, we will retrieve the updated encrypted counter value and decrypt it locally. But before we move on, let’s quickly run the tests to make sure everything is working correctly.

Run the test

From your project's root directory, run:

Copy
npx hardhat test

Expected Output

Copy
  FHECounter

FHECounter has been deployed at address 0x7553CB9124f974Ee475E5cE45482F90d5B6076BC

    ✔ should be deployed

    ✔ encrypted count should be uninitialized after deployment

    ✔ increment the counter by 1





  3 passing (7ms)
5
Call the getCount() function and Decrypt the value

Now that the counter has been incremented using an encrypted input, it's time to read the updated encrypted value from the smart contract and decrypt it using the userDecryptEuint function provided by the FHEVM Hardhat Plugin.

The userDecryptEuint function takes four parameters:

FhevmType: The integer type of the FHE-encrypted value. In this case, we're using FhevmType.euint32 because the counter is a uint32.

Encrypted handle: A 32-byte FHEVM handle representing the encrypted value you want to decrypt.

Smart contract address: The address of the contract that has permission to access the encrypted handle.

User signer: The signer (e.g., signers.alice) who has permission to access the handle.

Note: Permissions to access the FHEVM handle are set on-chain using the FHE.allow() Solidity function (see FHECounter.sol).

Replace :

Copy
// const countAfterInc = await counterContract.getCount();

// expect(countAfterInc).to.eq(countBeforeInc + 1n);

with the following:

Copy
const encryptedCountAfterInc = await fheCounterContract.getCount();

const clearCountAfterInc = await fhevm.userDecryptEuint(

  FhevmType.euint32,

  encryptedCountAfterInc,

  fheCounterContractAddress,

  signers.alice,

);

expect(clearCountAfterInc).to.eq(clearCountBeforeInc + clearOne);

Run the test

From your project's root directory, run:

Copy
npx hardhat test

Expected Output

Copy
  FHECounter

FHECounter has been deployed at address 0x7553CB9124f974Ee475E5cE45482F90d5B6076BC

    ✔ should be deployed

    ✔ encrypted count should be uninitialized after deployment

    ✔ increment the counter by 1





  3 passing (7ms)
6
Call the contract decrement() function

Similarly to the previous test, we’ll now call the decrement() function using an encrypted input.

Replace :

Copy
//   it("decrement the counter by 1", async function () {

//     // First increment, count becomes 1

//     let tx = await counterContract.connect(signers.alice).increment();

//     await tx.wait();

//     // Then decrement, count goes back to 0

//     tx = await counterContract.connect(signers.alice).decrement(1);

//     await tx.wait();

//     const count = await counterContract.getCount();

//     expect(count).to.eq(0);

//   });

with the following:

Copy
it("decrement the counter by 1", async function () {

  // Encrypt constant 1 as a euint32

  const clearOne = 1;

  const encryptedOne = await fhevm

    .createEncryptedInput(fheCounterContractAddress, signers.alice.address)

    .add32(clearOne)

    .encrypt();



  // First increment by 1, count becomes 1

  let tx = await fheCounterContract.connect(signers.alice).increment(encryptedOne.handles[0], encryptedOne.inputProof);

  await tx.wait();



  // Then decrement by 1, count goes back to 0

  tx = await fheCounterContract.connect(signers.alice).decrement(encryptedOne.handles[0], encryptedOne.inputProof);

  await tx.wait();



  const encryptedCountAfterDec = await fheCounterContract.getCount();

  const clearCountAfterDec = await fhevm.userDecryptEuint(

    FhevmType.euint32,

    encryptedCountAfterDec,

    fheCounterContractAddress,

    signers.alice,

  );



  expect(clearCountAfterDec).to.eq(0);

});

Run the test

From your project's root directory, run:

Copy
npx hardhat test

Expected Output

Copy
  FHECounter

FHECounter has been deployed at address 0x7553CB9124f974Ee475E5cE45482F90d5B6076BC

    ✔ should be deployed

    ✔ encrypted count should be uninitialized after deployment

    ✔ increment the counter by 1

    ✔ decrement the counter by 1





  4 passing (7ms)
Congratulations! You've completed the full tutorial.

You have successfully written and tested your FHEVM-based counter smart contract. By now, your project should include the following files:

contracts/FHECounter.sol — your Solidity smart contract

test/FHECounter.ts — your Hardhat test suite written in TypeScript

Next step

If you would like to deploy your project on the testnet, or learn more about using FHEVM Hardhat Plugin, head to Deploy contracts and run tests.

Previous
3. Turn it into FHEVM
Next
Configuration

Last updated 1 month ago

---

## 17. Configuration | Solidity Guides | Protocol

_Source: https://docs.zama.org/protocol/solidity-guides/smart-contract/configure_

Copy
SMART CONTRACT
Configuration

This document explains how to enable encrypted computations in your smart contract by setting up the fhevm environment. Learn how to integrate essential libraries, configure encryption, and add secure computation logic to your contracts.

Core configuration setup

To utilize encrypted computations in Solidity contracts, you must configure the FHE library and Oracle addresses. The fhevm package simplifies this process with prebuilt configuration contracts, allowing you to focus on developing your contract’s logic without handling the underlying cryptographic setup.

This library and its associated contracts provide a standardized way to configure and interact with Zama's FHEVM (Fully Homomorphic Encryption Virtual Machine) infrastructure on different Ethereum networks. It supplies the necessary contract addresses for Zama's FHEVM components (ACL, FHEVMExecutor, KMSVerifier, InputVerifier) and the decryption oracle, enabling seamless integration for Solidity contracts that require FHEVM support.

Key components configured automatically

FHE library: Sets up encryption parameters and cryptographic keys.

Oracle: Manages secure cryptographic operations such as public decryption.

Network-specific settings: Adapts to local testing, testnets (Sepolia for example), or mainnet deployment.

By inheriting these configuration contracts, you ensure seamless initialization and functionality across environments.

ZamaConfig.sol

The ZamaConfig library exposes functions to retrieve FHEVM configuration structs and oracle addresses for supported networks (currently only the Sepolia testnet).

Under the hood, this library encapsulates the network-specific addresses of Zama's FHEVM infrastructure into a single struct (FHEVMConfigStruct).

ZamaEthereumConfig

The ZamaEthereumConfig contract is designed to be inherited by a user contract. The constructor automatically sets up the FHEVM coprocessor and decryption oracle using the configuration provided by the library for the respective network. When a contract inherits from ZamaEthereumConfig, the constructor calls FHE.setCoprocessor with the appropriate addresses. This ensures that the inheriting contract is automatically wired to the correct FHEVM contracts and oracle for the target network, abstracting away manual address management and reducing the risk of misconfiguration.

Example

Copy
// SPDX-License-Identifier: BSD-3-Clause-Clear

pragma solidity ^0.8.24;



import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";



contract MyERC20 is ZamaEthereumConfig {

  constructor() {

    // Additional initialization logic if needed

  }

}
Using isInitialized

The isInitialized utility function checks whether an encrypted variable has been properly initialized, preventing unexpected behavior due to uninitialized values.

Function signature

Copy
function isInitialized(T v) internal pure returns (bool)

Purpose

Ensures encrypted variables are initialized before use.

Prevents potential logic errors in contract execution.

Example: Initialization Check for Encrypted Counter

Copy
require(FHE.isInitialized(counter), "Counter not initialized!");
Summary

By leveraging prebuilt a configuration contract like ZamaEthereumConfig in ZamaConfig.sol, you can efficiently set up your smart contract for encrypted computations. These tools abstract the complexity of cryptographic initialization, allowing you to focus on building secure, confidential smart contracts.

Previous
4. Test the FHEVM contract
Next
Contract addresses

Last updated 5 days ago

---

## 18. Contract addresses | Solidity Guides | Protocol

_Source: https://docs.zama.org/protocol/solidity-guides/smart-contract/configure/contract_addresses_

Copy
SMART CONTRACT
CONFIGURATION
Contract addresses

These are Sepolia addresses.

Contract/Service
Address/Value

FHEVM_EXECUTOR_CONTRACT

0x92C920834Ec8941d2C77D188936E1f7A6f49c127

ACL_CONTRACT

0xf0Ffdc93b7E186bC2f8CB3dAA75D86d1930A433D

HCU_LIMIT_CONTRACT

0xa10998783c8CF88D886Bc30307e631D6686F0A22

KMS_VERIFIER_CONTRACT

0xbE0E383937d564D7FF0BC3b46c51f0bF8d5C311A

INPUT_VERIFIER_CONTRACT

0xBBC1fFCdc7C316aAAd72E807D9b0272BE8F84DA0

DECRYPTION_ADDRESS

0x5D8BD78e2ea6bbE41f26dFe9fdaEAa349e077478

INPUT_VERIFICATION_ADDRESS

0x483b9dE06E4E4C7D35CCf5837A1668487406D955

RELAYER_URL

https://relayer.testnet.zama.org

GATEWAY_CHAIN_ID

10901

Previous
Configuration
Next
Supported types

Last updated 10 days ago

---

## 19. Supported types | Solidity Guides | Protocol

_Source: https://docs.zama.org/protocol/solidity-guides/smart-contract/types_

Copy
SMART CONTRACT
Supported types

This document introduces the encrypted integer types provided by the FHE library in FHEVM and explains their usage, including casting, state variable declarations, and type-specific considerations.

Introduction

The FHE library offers a robust type system with encrypted integer types, enabling secure computations on confidential data in smart contracts. These encrypted types are validated both at compile time and runtime to ensure correctness and security.

Key features of encrypted types

Encrypted integers function similarly to Solidity’s native integer types, but they operate on Fully Homomorphic Encryption (FHE) ciphertexts.

Arithmetic operations on e(u)int types are unchecked, meaning they wrap around on overflow. This design choice ensures confidentiality by avoiding the leakage of information through error detection.

Future versions of the FHE library will support encrypted integers with overflow checking, but with the trade-off of exposing limited information about the operands.

Encrypted integers with overflow checking will soon be available in the FHE library. These will allow reversible arithmetic operations but may reveal some information about the input values.

Encrypted integers in FHEVM are represented as FHE ciphertexts, abstracted using ciphertext handles. These types, prefixed with e (for example, euint64) act as secure wrappers over the ciphertext handles.

List of encrypted types

The FHE library currently supports the following encrypted types:

Type
Bit Length
Supported Operators
Aliases (with supported operators)

Ebool

2

and, or, xor, eq, ne, not, select, rand

Euint8

8

add, sub, mul, div, rem, and, or, xor, shl, shr, rotl, rotr, eq, ne, ge, gt, le, lt, min, max, neg, not, select, rand, randBounded

Euint16

16

add, sub, mul, div, rem, and, or, xor, shl, shr, rotl, rotr, eq, ne, ge, gt, le, lt, min, max, neg, not, select, rand, randBounded

Euint32

32

add, sub, mul, div, rem, and, or, xor, shl, shr, rotl, rotr, eq, ne, ge, gt, le, lt, min, max, neg, not, select, rand, randBounded

Euint64

64

add, sub, mul, div, rem, and, or, xor, shl, shr, rotl, rotr, eq, ne, ge, gt, le, lt, min, max, neg, not, select, rand, randBounded

Euint128

128

add, sub, mul, div, rem, and, or, xor, shl, shr, rotl, rotr, eq, ne, ge, gt, le, lt, min, max, neg, not, select, rand, randBounded

Euint160

160

Eaddress (eq, ne, select)

Euint256

256

and, or, xor, shl, shr, rotl, rotr, eq, ne, neg, not, select, rand, randBounded

Division (div) and remainder (rem) operations are only supported when the right-hand side (rhs) operand is a plaintext (non-encrypted) value. Attempting to use an encrypted value as rhs will result in a panic. This restriction ensures correct and secure computation within the current framework.

Higher-precision integer types are available in the TFHE-rs library and can be added to fhevm as needed.

Previous
Contract addresses
Next
Operations on encrypted types

Last updated 1 month ago

---

## 20. Operations on encrypted types | Solidity Guides | Protocol

_Source: https://docs.zama.org/protocol/solidity-guides/smart-contract/operations_

Copy
SMART CONTRACT
Operations on encrypted types

This document outlines the operations supported on encrypted types in the FHE library, enabling arithmetic, bitwise, comparison, and more on Fully Homomorphic Encryption (FHE) ciphertexts.

Arithmetic operations

The following arithmetic operations are supported for encrypted integers (euintX):

Name
Function name
Symbol
Type

Add

FHE.add

+

Binary

Subtract

FHE.sub

-

Binary

Multiply

FHE.mul

*

Binary

Divide (plaintext divisor)

FHE.div

Binary

Reminder (plaintext divisor)

FHE.rem

Binary

Negation

FHE.neg

-

Unary

Min

FHE.min

Binary

Max

FHE.max

Binary

Division (FHE.div) and remainder (FHE.rem) operations are currently supported only with plaintext divisors.

Bitwise operations

The FHE library also supports bitwise operations, including shifts and rotations:

Name
Function name
Symbol
Type

Bitwise AND

FHE.and

&

Binary

Bitwise OR

FHE.or

|

Binary

Bitwise XOR

FHE.xor

^

Binary

Bitwise NOT

FHE.not

~

Unary

Shift Right

FHE.shr

Binary

Shift Left

FHE.shl

Binary

Rotate Right

FHE.rotr

Binary

Rotate Left

FHE.rotl

Binary

The shift operators FHE.shr and FHE.shl can take any encrypted type euintX as a first operand and either a uint8or a euint8 as a second operand, however the second operand will always be computed modulo the number of bits of the first operand. For example, FHE.shr(euint64 x, 70) is equivalent to FHE.shr(euint64 x, 6) because 70 % 64 = 6. This differs from the classical shift operators in Solidity, where there is no intermediate modulo operation, so for instance any uint64 shifted right via >> would give a null result.

Comparison operations

Encrypted integers can be compared using the following functions:

Name
Function name
Symbol
Type

Equal

FHE.eq

Binary

Not equal

FHE.ne

Binary

Greater than or equal

FHE.ge

Binary

Greater than

FHE.gt

Binary

Less than or equal

FHE.le

Binary

Less than

FHE.lt

Binary

Ternary operation

The FHE.select function is a ternary operation that selects one of two encrypted values based on an encrypted condition:

Name
Function name
Symbol
Type

Select

FHE.select

Ternary

Random operations

You can generate cryptographically secure random numbers fully on-chain:

Name

Function Name

Symbol

Type

Random Unsigned Integer

FHE.randEuintX()

Random

For more details, refer to the Random Encrypted Numbers document.

Best Practices

Here are some best practices to follow when using encrypted operations in your smart contracts:

Use the appropriate encrypted type size

Choose the smallest encrypted type that can accommodate your data to optimize gas costs. For example, use euint8 for small numbers (0-255) rather than euint256.

❌ Avoid using oversized types:

Copy
// Bad: Using euint256 for small numbers wastes gas

euint64 age = FHE.asEuint128(25);  // age will never exceed 255

euint64 percentage = FHE.asEuint128(75);  // percentage is 0-100

✅ Instead, use the smallest appropriate type:

Copy
// Good: Using appropriate sized types

euint8 age = FHE.asEuint8(25);  // age fits in 8 bits

euint8 percentage = FHE.asEuint8(75);  // percentage fits in 8 bits
Use scalar operands when possible to save gas

Some FHE operators exist in two versions: one where all operands are ciphertexts handles, and another where one of the operands is an unencrypted scalar. Whenever possible, use the scalar operand version, as this will save a lot of gas.

❌ For example, this snippet cost way more in gas:

Copy
euint32 x;

...

x = FHE.add(x,FHE.asEuint(42));

✅ Than this one:

Copy
euint32 x;

// ...

x = FHE.add(x,42);

Despite both leading to the same encrypted result!

Beware of overflows of FHE arithmetic operators

FHE arithmetic operators can overflow. Do not forget to take into account such a possibility when implementing FHEVM smart contracts.

❌ For example, if you wanted to create a mint function for an encrypted ERC20 token with an encrypted totalSupply state variable, this code is vulnerable to overflows:

Copy
function mint(externalEuint32 encryptedAmount, bytes calldata inputProof) public {

  euint32 mintedAmount = FHE.asEuint32(encryptedAmount, inputProof);

  totalSupply = FHE.add(totalSupply, mintedAmount);

  balances[msg.sender] = FHE.add(balances[msg.sender], mintedAmount);

  FHE.allowThis(balances[msg.sender]);

  FHE.allow(balances[msg.sender], msg.sender);

}

✅ But you can fix this issue by using FHE.select to cancel the mint in case of an overflow:

Copy
function mint(externalEuint32 encryptedAmount, bytes calldata inputProof) public {

  euint32 mintedAmount = FHE.asEuint32(encryptedAmount, inputProof);

  euint32 tempTotalSupply = FHE.add(totalSupply, mintedAmount);

  ebool isOverflow = FHE.lt(tempTotalSupply, totalSupply);

  totalSupply = FHE.select(isOverflow, totalSupply, tempTotalSupply);

  euint32 tempBalanceOf = FHE.add(balances[msg.sender], mintedAmount);

  balances[msg.sender] = FHE.select(isOverflow, balances[msg.sender], tempBalanceOf);

  FHE.allowThis(balances[msg.sender]);

  FHE.allow(balances[msg.sender], msg.sender);

}

Notice that we did not check separately the overflow on balances[msg.sender] but only on totalSupply variable, because totalSupply is the sum of the balances of all the users, so balances[msg.sender] could never overflow if totalSupply did not.

Previous
Supported types
Next
Casting and trivial encryption

Last updated 1 month ago

---

## 21. Casting and trivial encryption | Solidity Guides | Protocol

_Source: https://docs.zama.org/protocol/solidity-guides/smart-contract/operations/casting_

Copy
SMART CONTRACT
OPERATIONS ON ENCRYPTED TYPES
Casting and trivial encryption

This documentation covers the asEbool, asEuintXX, and asEaddress operations provided by the FHE library for working with encrypted data in the FHEVM. These operations are essential for converting between plaintext and encrypted types, as well as handling encrypted inputs.

The operations can be categorized into two main use cases:

Trivial encryption: Converting plaintext values to encrypted types

Type casting: Converting between different encrypted types

1. Trivial encryption

Trivial encryption simply put is a plain text in a format of a ciphertext.

Overview

Trivial encryption is the process of converting plaintext values into encrypted types (ciphertexts) compatible with FHE operators. Although the data is in ciphertext format, it remains publicly visible on-chain, making it useful for operations between public and private values.

This type of casting involves converting plaintext (unencrypted) values into their encrypted equivalents, such as:

bool → ebool

uint → euintXX

address → eaddress

When doing trivial encryption, the data is made compatible with FHE operations but remains publicly visible on-chain unless explicitly encrypted.

Example
Copy
euint64 value64 = FHE.asEuint64(7262);  // Trivial encrypt a uint64

ebool valueBool = FHE.asEbool(true);   // Trivial encrypt a boolean
2. Casting between encrypted types

This type of casting is used to reinterpret or convert one encrypted type into another. For example:

euint32 → euint64

Casting between encrypted types is often required when working with operations that demand specific sizes or precisions.

Important: When casting between encrypted types:

Casting from smaller types to larger types (e.g. euint32 → euint64) preserves all information

Casting from larger types to smaller types (e.g. euint64 → euint32) will truncate and lose information

The table below summarizes the available casting functions:

From type
To type
Function

euintX

euintX

FHE.asEuintXX

ebool

euintX

FHE.asEuintXX

euintX

ebool

FHE.asEboolXX

Casting between encrypted types is efficient and often necessary when handling data with differing precision requirements.

Workflow for encrypted types
Copy
// Casting between encrypted types

euint32 value32 = FHE.asEuint32(value64); // Cast to euint32

ebool valueBool = FHE.asEbool(value32);   // Cast to ebool
Overall operation summary
Casting Type
Function
Input Type
Output Type

Trivial encryption

FHE.asEuintXX(x)

uintX

euintX

FHE.asEbool(x)

bool

ebool

FHE.asEaddress(x)

address

eaddress

Conversion between types

FHE.asEuintXX(x)

euintXX/ebool

euintYY

FHE.asEbool(x)

euintXX

ebool

Previous
Operations on encrypted types
Next
Generate random numbers

Last updated 1 month ago

---

## 22. Generate random numbers | Solidity Guides | Protocol

_Source: https://docs.zama.org/protocol/solidity-guides/smart-contract/operations/random_

Copy
SMART CONTRACT
OPERATIONS ON ENCRYPTED TYPES
Generate random numbers

This document explains how to generate cryptographically secure random encrypted numbers fully on-chain using the FHE library in fhevm. These numbers are encrypted and remain confidential, enabling privacy-preserving smart contract logic.

Key notes on random number generation

On-chain execution: Random number generation must be executed during a transaction, as it requires the pseudo-random number generator (PRNG) state to be updated on-chain. This operation cannot be performed using the eth_call RPC method.

Cryptographic security: The generated random numbers are cryptographically secure and encrypted, ensuring privacy and unpredictability.

Random number generation must be performed during transactions, as it requires the pseudo-random number generator (PRNG) state to be mutated on-chain. Therefore, it cannot be executed using the eth_call RPC method.

Basic usage

The FHE library allows you to generate random encrypted numbers of various bit sizes. Below is a list of supported types and their usage:

Copy
// Generate random encrypted numbers

ebool rb = FHE.randEbool();       // Random encrypted boolean

euint8 r8 = FHE.randEuint8();     // Random 8-bit number

euint16 r16 = FHE.randEuint16();  // Random 16-bit number

euint32 r32 = FHE.randEuint32();  // Random 32-bit number

euint64 r64 = FHE.randEuint64();  // Random 64-bit number

euint128 r128 = FHE.randEuint128(); // Random 128-bit number

euint256 r256 = FHE.randEuint256(); // Random 256-bit number
Example: Random Boolean
Copy
function randomBoolean() public returns (ebool) {

  return FHE.randEbool();

}
Bounded random numbers

To generate random numbers within a specific range, you can specify an upper bound. The specified upper bound must be a power of 2. The random number will be in the range [0, upperBound - 1].

Copy
// Generate random numbers with upper bounds

euint8 r8 = FHE.randEuint8(32);      // Random number between 0-31

euint16 r16 = FHE.randEuint16(512);  // Random number between 0-511

euint32 r32 = FHE.randEuint32(65536); // Random number between 0-65535
Example: Random number with upper bound
Copy
function randomBoundedNumber(uint16 upperBound) public returns (euint16) {

  return FHE.randEuint16(upperBound);

}
Security Considerations

Cryptographic security:
The random numbers are generated using a cryptographically secure pseudo-random number generator (CSPRNG) and remain encrypted until explicitly decrypted.

Gas consumption:
Each call to a random number generation function consumes gas. Developers should optimize the use of these functions, especially in gas-sensitive contracts.

Privacy guarantee:
Random values are fully encrypted, ensuring they cannot be accessed or predicted by unauthorized parties.

Previous
Casting and trivial encryption
Next
Encrypted inputs

Last updated 1 month ago

---

## 23. Encrypted inputs | Solidity Guides | Protocol

_Source: https://docs.zama.org/protocol/solidity-guides/smart-contract/inputs_

Copy
SMART CONTRACT
Encrypted inputs

This document introduces the concept of encrypted inputs in the FHEVM, explaining their role, structure, validation process, and how developers can integrate them into smart contracts and applications.

Encrypted inputs are a core feature of FHEVM, enabling users to push encrypted data onto the blockchain while ensuring data confidentiality and integrity.

What are encrypted inputs?

Encrypted inputs are data values submitted by users in ciphertext form. These inputs allow sensitive information to remain confidential while still being processed by smart contracts. They are accompanied by Zero-Knowledge Proofs of Knowledge (ZKPoKs) to ensure the validity of the encrypted data without revealing the plaintext.

Key characteristics of encrypted inputs:

Confidentiality: Data is encrypted using the public FHE key, ensuring that only authorized parties can decrypt or process the values.

Validation via ZKPoKs: Each encrypted input is accompanied by a proof verifying that the user knows the plaintext value of the ciphertext, preventing replay attacks or misuse.

Efficient packing: All inputs for a transaction are packed into a single ciphertext in a user-defined order, optimizing the size and generation of the zero-knowledge proof.

Parameters in encrypted functions

When a function in a smart contract is called, it may accept two types of parameters for encrypted inputs:

externalEbool, externalEaddress,externalEuintXX: Refers to the index of the encrypted parameter within the proof, representing a specific encrypted input handle.

bytes: Contains the ciphertext and the associated zero-knowledge proof used for validation.

Here’s an example of a Solidity function accepting multiple encrypted parameters:

Copy
function exampleFunction(

  externalEbool param1,

  externalEuint64 param2,

  externalEuint8 param3,

  bytes calldata inputProof

) public {

  // Function logic here

}

In this example, param1, param2, and param3 are encrypted inputs for ebool, euint64, and euint8 while inputProof contains the corresponding ZKPoK to validate their authenticity.

Input Generation using Hardhat

In the below example, we use Alice's address to create the encrypted inputs and submits the transaction.

Copy
import { fhevm } from "hardhat";



const input = fhevm.createEncryptedInput(contract.address, signers.alice.address);

input.addBool(canTransfer); // at index 0

input.add64(transferAmount); // at index 1

input.add8(transferType); // at index 2

const encryptedInput = await input.encrypt();



const externalEboolParam1 = encryptedInput.handles[0];

const externalEuint64Param2 = encryptedInput.handles[1];

const externalEuint8Param3 = encryptedInput.handles[2];

const inputProof = encryptedInput.inputProof;



tx = await myContract

  .connect(signers.alice)

  [

    "exampleFunction(bytes32,bytes32,bytes32,bytes)"

  ](signers.bob.address, externalEboolParam1, externalEuint64Param2, externalEuint8Param3, inputProof);



await tx.wait();
Input Order

Developers are free to design the function parameters in any order. There is no required correspondence between the order in which encrypted inputs are constructed in TypeScript and the order of arguments in the Solidity function.

Validating encrypted inputs

Smart contracts process encrypted inputs by verifying them against the associated zero-knowledge proof. This is done using the FHE.asEuintXX, FHE.asEbool, or FHE.asEaddress functions, which validate the input and convert it into the appropriate encrypted type.

Example validation

This example demonstrates a function that performs multiple encrypted operations, such as updating a user's encrypted balance and toggling an encrypted boolean flag:

Copy
function myExample(externalEuint64 encryptedAmount, externalEbool encryptedToggle, bytes calldata inputProof) public {

  // Validate and convert the encrypted inputs

  euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);

  ebool toggleFlag = FHE.fromExternal(encryptedToggle, inputProof);



  // Update the user's encrypted balance

  balances[msg.sender] = FHE.add(balances[msg.sender], amount);



  // Toggle the user's encrypted flag

  userFlags[msg.sender] = FHE.not(toggleFlag);



  // FHE permissions and function logic here

  ...

}



// Function to retrieve a user's encrypted balance

function getEncryptedBalance() public view returns (euint64) {

  return balances[msg.sender];

}



// Function to retrieve a user's encrypted flag

function getEncryptedFlag() public view returns (ebool) {

  return userFlags[msg.sender];

}
Example validation in the ConfidentialERC20.sol smart contract

Here’s an example of a smart contract function that verifies an encrypted input before proceeding:

Copy
function transfer(

  address to,

  externalEuint64 encryptedAmount,

  bytes calldata inputProof

) public {

  // Verify the provided encrypted amount and convert it into an encrypted uint64

  euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);



  // Function logic here, such as transferring funds

  ...

}
How validation works

Input verification:
The FHE.fromExternal function ensures that the input is a valid ciphertext with a corresponding ZKPoK.

Type conversion:
The function transforms externalEbool, externalEaddress, externalEuintXX into the appropriate encrypted type (ebool, eaddress, euintXX) for further operations within the contract.

Best Practices

Input packing: Minimize the size and complexity of zero-knowledge proofs by packing all encrypted inputs into a single ciphertext.

Frontend encryption: Always encrypt inputs using the FHE public key on the client side to ensure data confidentiality.

Proof management: Ensure that the correct zero-knowledge proof is associated with each encrypted input to avoid validation errors.

Encrypted inputs and their validation form the backbone of secure and private interactions in the FHEVM. By leveraging these tools, developers can create robust, privacy-preserving smart contracts without compromising functionality or scalability.

Previous
Generate random numbers
Next
Access Control List

Last updated 1 month ago

---

## 24. Access Control List | Solidity Guides | Protocol

_Source: https://docs.zama.org/protocol/solidity-guides/smart-contract/acl_

Copy
SMART CONTRACT
Access Control List

This document describes the Access Control List (ACL) system in FHEVM, a core feature that governs access to encrypted data. The ACL ensures that only authorized accounts or contracts can interact with specific ciphertexts, preserving confidentiality while enabling composable smart contracts. This overview provides a high-level understanding of what the ACL is, why it's essential, and how it works.

What is the ACL?

The ACL is a permission management system designed to control who can access, compute on, or decrypt encrypted values in fhevm. By defining and enforcing these permissions, the ACL ensures that encrypted data remains secure while still being usable within authorized contexts.

Why is the ACL important?

Encrypted data in FHEVM is entirely confidential, meaning that without proper access control, even the contract holding the ciphertext cannot interact with it. The ACL enables:

Granular permissions: Define specific access rules for individual accounts or contracts.

Secure computations: Ensure that only authorized entities can manipulate or decrypt encrypted data.

Gas efficiency: Optimize permissions using transient access for temporary needs, reducing storage and gas costs.

How does the ACL work?
Types of access

Permanent allowance:

Configured using FHE.allow(ciphertext, address).

Grants long-term access to the ciphertext for a specific address.

Stored in a dedicated contract for persistent storage.

Transient allowance:

Configured using FHE.allowTransient(ciphertext, address).

Grants access to the ciphertext only for the duration of the current transaction.

Stored in transient storage, reducing gas costs.

Ideal for temporary operations like passing ciphertexts to external functions.

Permanent public allowance:

Configured using FHE.makePubliclyDecryptable(ciphertext).

Grants long-term access to the ciphertext for any user.

Stored in a dedicated contract for persistent storage.

Syntactic sugar:

FHE.allowThis(ciphertext) is shorthand for FHE.allow(ciphertext, address(this)). It authorizes the current contract to reuse a ciphertext handle in future transactions.

Transient vs. permanent allowance
Allowance type
Purpose
Storage type
Use case

Transient

Temporary access during a transaction.

Transient storage (EIP-1153)

Calling external functions or computations with ciphertexts. Use when wanting to save on gas costs.

Permanent

Long-term access across multiple transactions.

Dedicated contract storage

Persistent ciphertexts for contracts or users requiring ongoing access.

Granting and verifying access
Granting access

Developers can use functions like allow, allowThis, and allowTransient to grant permissions:

allow: Grants permanent access to an address.

allowThis: Grants the current contract access to manipulate the ciphertext.

allowTransient: Grants temporary access to an address for the current transaction.

makePubliclyDecryptable: Grants permanent, global permission for any entity to decrypt the cleartext value associated with the given ciphertext (handle) off-chain.

Verifying access

To check if an entity has permission to access a ciphertext, use functions like isAllowed or isSenderAllowed:

isAllowed: Verifies if a specific address has permission.

isSenderAllowed: Simplifies checks for the current transaction sender.

isPubliclyDecryptable: Verifies whether any entity is permitted to retrieve the ciphertext's cleartext value off-chain.

checkSignatures: Verifies the authenticity of a cleartext value by checking cryptographic signatures. This ensures that the value submitted back to the chain originated from a legitimate public decryption operation on the associated ciphertext handle.

Practical uses of the ACL

Confidential parameters: Pass encrypted values securely between contracts, ensuring only authorized entities can access them.

Secure state management: Store encrypted state variables while controlling who can modify or read them.

Privacy-preserving computations: Enable computations on encrypted data with confidence that permissions are enforced.

Publicly Verifiable Result Reveal: Enable the public reveal of a confidential operation's final result. For example, enabling the public to verify the final price in a sealed-bid confidential auction.

For a detailed explanation of the ACL's functionality, including code examples and advanced configurations, see ACL examples.

Previous
Encrypted inputs
Next
ACL examples

Last updated 5 days ago

---

## 25. ACL examples | Solidity Guides | Protocol

_Source: https://docs.zama.org/protocol/solidity-guides/smart-contract/acl/acl_examples_

Copy
SMART CONTRACT
ACCESS CONTROL LIST
ACL examples

This page provides detailed instructions and examples on how to use and implement the ACL (Access Control List) in FHEVM. For an overview of ACL concepts and their importance, refer to the access control list (ACL) overview.

Controlling access: permanent and transient allowances

The ACL system allows you to define two types of permissions for accessing ciphertexts:

Permanent allowance

Function: FHE.allow(ciphertext, address)

Purpose: Grants persistent access to a ciphertext for a specific address.

Storage: Permissions are saved in a dedicated ACL contract, making them available across transactions.

Alternative Solidity syntax

You can also use method-chaining syntax for granting allowances since FHE is a Solidity library.

Copy
using FHE for *;

ciphertext.allow(address1).allow(address2);

This is equivalent to calling FHE.allow(ciphertext, address1) followed by FHE.allow(ciphertext, address2).

Transient allowance

Function: FHE.allowTransient(ciphertext, address)

Purpose: Grants temporary access for the duration of a single transaction.

Storage: Permissions are stored in transient storage to save gas costs.

Use Case: Ideal for passing encrypted values between functions or contracts during a transaction.

Alternative Solidity syntax

Method chaining is also available for transient allowances since FHE is a Solidity library.

Copy
using FHE for *;

ciphertext.allowTransient(address1).allowTransient(address2);
Syntactic sugar

Function: FHE.allowThis(ciphertext)

Equivalent To: FHE.allow(ciphertext, address(this))

Purpose: Simplifies granting permanent access to the current contract for managing ciphertexts.

Alternative Solidity syntax

You can also use method-chaining syntax for allowThis since FHE is a Solidity library.

Copy
using FHE for *;

ciphertext.allowThis();
Make publicly decryptable

To make a ciphertext publicly decryptable, you can use the FHE.makePubliclyDecryptable(ciphertext) function. This grants decryption rights to anyone, which is useful for scenarios where the encrypted value should be accessible by all.

Copy
// Grant public decryption right to a ciphertext

FHE.makePubliclyDecryptable(ciphertext);



// Or using method syntax:

ciphertext.makePubliclyDecryptable();

Function: FHE.makePubliclyDecryptable(ciphertext)

Purpose: Makes the ciphertext decryptable by anyone.

Use Case: When you want to publish encrypted results or data.

You can combine multiple allowance methods (such as .allow(), .allowThis(), .allowTransient()) directly on ciphertext objects to grant access to several addresses or contracts in a single, fluent statement.

Example

Copy
// Grant transient access to one address and permanent access to another address

ciphertext.allowTransient(address1).allow(address2);



// Grant permanent access to the current contract and another address

ciphertext.allowThis().allow(address1);
Best practices
Verifying sender access

When processing ciphertexts as input, it’s essential to validate that the sender is authorized to interact with the provided encrypted data. Failing to perform this verification can expose the system to inference attacks where malicious actors attempt to deduce private information.

Example scenario: Confidential ERC20 attack

Consider an Confidential ERC20 token. An attacker controlling two accounts, Account A and Account B, with 100 tokens in Account A, could exploit the system as follows:

The attacker attempts to send the target user's encrypted balance from Account A to Account B.

Observing the transaction outcome, the attacker gains information:

If successful: The target's balance is equal to or less than 100 tokens.

If failed: The target's balance exceeds 100 tokens.

This type of attack allows the attacker to infer private balances without explicit access.

To prevent this, always use the FHE.isSenderAllowed() function to verify that the sender has legitimate access to the encrypted amount being transferred.

Example: secure verification
Copy
function transfer(address to, euint64 encryptedAmount) public {

  // Ensure the sender is authorized to access the encrypted amount

  require(FHE.isSenderAllowed(encryptedAmount), "Unauthorized access to encrypted amount.");



  // Proceed with further logic

  ...

}

By enforcing this check, you can safeguard against inference attacks and ensure that encrypted values are only manipulated by authorized entities.

ACL for user decryption

If a ciphertext can be decrypt by a user, explicit access must be granted to them. Additionally, the user decryption mechanism requires the signature of a public key associated with the contract address. Therefore, a value that needs to be decrypted must be explicitly authorized for both the user and the contract.

Due to the user decryption mechanism, a user signs a public key associated with a specific contract; therefore, the ciphertext also needs to be allowed for the contract.

Example: Secure Transfer in ConfidentialERC20
Copy
function transfer(address to, euint64 encryptedAmount) public {

  require(FHE.isSenderAllowed(encryptedAmount), "The caller is not authorized to access this encrypted amount.");

  euint64 amount = FHE.asEuint64(encryptedAmount);

  ebool canTransfer = FHE.le(amount, balances[msg.sender]);



  euint64 newBalanceTo = FHE.add(balances[to], FHE.select(canTransfer, amount, FHE.asEuint64(0)));

  balances[to] = newBalanceTo;

  // Allow this new balance for both the contract and the owner.

  FHE.allowThis(newBalanceTo);

  FHE.allow(newBalanceTo, to);



  euint64 newBalanceFrom = FHE.sub(balances[from], FHE.select(canTransfer, amount, FHE.asEuint64(0)));

  balances[from] = newBalanceFrom;

  // Allow this new balance for both the contract and the owner.

  FHE.allowThis(newBalanceFrom);

  FHE.allow(newBalanceFrom, from);

}

By understanding how to grant and verify permissions, you can effectively manage access to encrypted data in your FHEVM smart contracts. For additional context, see the ACL overview.

Previous
Access Control List
Next
Reorgs handling

Last updated 1 month ago

---

## 26. Reorgs handling | Solidity Guides | Protocol

_Source: https://docs.zama.org/protocol/solidity-guides/smart-contract/acl/reorgs_handling_

Copy
SMART CONTRACT
ACCESS CONTROL LIST
Reorgs handling

This page provides detailed instructions on how to handle reorg risks on Ethereum when using FHEVM.

Since ACL events are propagated from the FHEVM host chain to the Gateway immediately after being included in a block, dApp developers must take special care when encrypted information is critically important. For example, if an encrypted handle conceals the private key of a Bitcoin wallet holding significant funds, we need to ensure that this information cannot inadvertently leak to the wrong person due to a reorg on the FHEVM host chain. Therefore, it's the responsibility of dApp developers to prevent such scenarios by implementing a two-step ACL authorization process with a timelock between the request and the ACL call.

Simple example: Handling reorg risk on Ethereum

On Ethereum, a reorg can be up to 95 slots deep in the worst case, so waiting for more than 95 blocks should ensure that a previously sent transaction has been finalized—unless more than 1/3 of the nodes are malicious and willing to lose their stake, which is highly improbable.

❌ Instead of writing this contract:

Copy
contract PrivateKeySale {

  euint256 privateKey;

  bool isAlreadyBought = false;



  constructor(externalEuint256 _privateKey, bytes inputProof) {

    privateKey = FHE.fromExternal(_privateKey, inputProof);

    FHE.allowThis(privateKey);

  }



  function buyPrivateKey() external payable {

    require(msg.value == 1 ether, "Must pay 1 ETH");

    require(!isBought, "Private key already bought");

    isBought = true;

    FHE.allow(encryptedPrivateKey, msg.sender);

  }

}

Since the `privateKey`` encrypted variable contains critical information, we don't want to mistakenly leak it for free if a reorg occurs. This could happen in the previous example because we immediately grant authorization to the buyer in the same transaction that processes the sale.

✅ We recommend writing something like this instead:

Copy
contract PrivateKeySale {

  euint256 privateKey;

  bool isAlreadyBought = false;

  uint256 blockWhenBought = 0;

  address buyer;



  constructor(externalEuint256 _privateKey, bytes inputProof) {

    privateKey = FHE.fromExternal(_privateKey, inputProof);

    FHE.allowThis(privateKey);

  }



  function buyPrivateKey() external payable {

    require(msg.value == 1 ether, "Must pay 1 ETH");

    require(!isBought, "Private key already bought");

    isBought = true;

    blockWhenBought = block.number;

    buyer = msg.sender;

  }



  function requestACL() external {

    require(isBought, "Private key has not been bought yet");

    require(block.number > blockWhenBought + 95, "Too early to request ACL, risk of reorg");

    FHE.allow(privateKey, buyer);

  }

}

This approach ensures that at least 96 blocks have elapsed between the transaction that purchases the private key and the transaction that authorizes the buyer to decrypt it.

This type of contract worsens the user experience by adding a timelock before users can decrypt data, so it should be used sparingly: only when leaked information could be critically important and high-value.

Previous
ACL examples
Next
Logics

Last updated 1 month ago

---

## 27. Logics | Solidity Guides | Protocol

_Source: https://docs.zama.org/protocol/solidity-guides/smart-contract/logics_

+
26
Protocol
Ctrl
K
GitHub
Developer Program
Libraries
Support
Change Log
Protocol Overview
Solidity Guides
Relayer SDK Guides
Examples
Zama Protocol Litepaper
v0.9
Overview
GETTING STARTED
What is FHEVM Solidity
Set up Hardhat
Quick start tutorial
1. Set up Hardhat
2. Write a simple contract
3. Turn it into FHEVM
4. Test the FHEVM contract
SMART CONTRACT
Configuration
Contract addresses
Supported types
Operations on encrypted types
Casting and trivial encryption
Generate random numbers
Encrypted inputs
Access Control List
ACL examples
Reorgs handling
Logics
Branching
Dealing with branches and conditions
Error handling
Decryption
DEVELOPMENT GUIDE
Hardhat plugin
Foundry
HCU
Migrate to v0.9
How to Transform Your Smart Contract into a FHEVM Smart Contract?
Powered by GitBook
Copy
SMART CONTRACT
Logics
Branching
Dealing with branches and conditions
Error handling
Previous
Reorgs handling
Next
Branching
✓ Đã thêm vào collection!

---

## 28. Branching | Solidity Guides | Protocol

_Source: https://docs.zama.org/protocol/solidity-guides/smart-contract/logics/conditions_

Copy
SMART CONTRACT
LOGICS
Branching

This document explains how to implement conditional logic (if/else branching) when working with encrypted values in FHEVM. Unlike typical Solidity programming, working with Fully Homomorphic Encryption (FHE) requires specialized methods to handle conditions on encrypted data.

This document covers encrypted branching and how to move from an encrypted condition to a non-encrypted business logic in your smart contract.

What is confidential branching?

In FHEVM, when you perform comparison operations, the result is an encrypted boolean (ebool). Since encrypted booleans do not support standard boolean operations like if statements or logical operators, conditional logic must be implemented using specialized methods.

To facilitate conditional assignments, FHEVM provides the FHE.select function, which acts as a ternary operator for encrypted values.

Using FHE.select for conditional logic

The FHE.select function enables branching logic by selecting one of two encrypted values based on an encrypted condition (ebool). It works as follows:

Copy
FHE.select(condition, valueIfTrue, valueIfFalse);

condition: An encrypted boolean (ebool) resulting from a comparison.

valueIfTrue: The encrypted value to return if the condition is true.

valueIfFalse: The encrypted value to return if the condition is false.

Example: Auction Bidding Logic

Here's an example of using conditional logic to update the highest winning number in a guessing game:

Copy
function bid(externalEuint64 encryptedValue, bytes calldata inputProof) external onlyBeforeEnd {

  // Convert the encrypted input to an encrypted 64-bit integer

  euint64 bid = FHE.asEuint64(encryptedValue, inputProof);



  // Compare the current highest bid with the new bid

  ebool isAbove = FHE.lt(highestBid, bid);



  // Update the highest bid if the new bid is greater

  highestBid = FHE.select(isAbove, bid, highestBid);



  // Allow the contract to use the updated highest bid ciphertext

  FHE.allowThis(highestBid);

}

This is a simplified example to demonstrate the functionality.

How Does It Work?

Comparison:

The FHE.lt function compares highestBid and bid, returning an ebool (isAbove) that indicates whether the new bid is higher.

Selection:

The FHE.select function updates highestBid to either the new bid or the previous highest bid, based on the encrypted condition isAbove.

Permission Handling:

After updating highestBid, the contract reauthorizes itself to manipulate the updated ciphertext using FHE.allowThis.

Key Considerations

Value change behavior: Each time FHE.select assigns a value, a new ciphertext is created, even if the underlying plaintext value remains unchanged. This behavior is inherent to FHE and ensures data confidentiality, but developers should account for it when designing their smart contracts.

Gas consumption: Using FHE.select and other encrypted operations incurs additional gas costs compared to traditional Solidity logic. Optimize your code to minimize unnecessary operations.

Access control: Always use appropriate ACL functions (e.g., FHE.allowThis, FHE.allow) to ensure the updated ciphertexts are authorized for use in future computations or transactions.

How to branch to a non-confidential path?

So far, this section only covered how to do branching using encrypted variables. However, there may be many cases where the "public" contract logic will depend on the outcome from a encrypted path.

To do so, there are only one way to branch from an encrypted path to a non-encrypted path: it requires an off-chain public decryption. Hence, any contract logic that requires moving from an encrypted input to a non-encrypted path always requires an async contract logic.

Example: Auction Bidding Logic: Item Release

Going back to our previous example with the auction bidding logic. Let's assume that the winner of the auction can receive some prize, which is not confidential.

Copy
bool public isPrizeDistributed;

eaddress internal highestBidder;

euint64 internal highestBid;



function bid(externalEuint64 encryptedValue, bytes calldata inputProof) external onlyBeforeEnd {

  // Convert the encrypted input to an encrypted 64-bit integer

  euint64 bid = FHE.asEuint64(encryptedValue, inputProof);



  // Compare the current highest bid with the new bid

  ebool isAbove = FHE.lt(highestBid, bid);



  // Update the highest bid if the new bid is greater

  highestBid = FHE.select(isAbove, bid, highestBid);



  // Update the highest bidder address if the new bid is greater

  highestBidder = FHE.select(isAbove, FHE.asEaddress(msg.sender), currentBidder));



  // Allow the contract to use the highest bidder address

  FHE.allowThis(highestBidder);



  // Allow the contract to use the updated highest bid ciphertext

  FHE.allowThis(highestBid);

}



function revealWinner() external onlyAfterEnd {

  FHE.makePubliclyDecryptable(highestBidder);

}



function transferPrize(address auctionWinner, bytes calldata decryptionProof) external {

  require(!isPrizeDistributed, "Prize has already been distributed");



  bytes32[] memory cts = new bytes32[](1);

  cts[0] = FHE.toBytes32(highestBidder);



  bytes memory cleartexts = abi.encode(auctionWinner);



  // This FHE call reverts the transaction if:

  // - the decryption proof is invalid.

  // - the provided cleartext (auctionWinner) does not match the cleartext value

  //   that results from the off-chain decryption of the ciphertext (highestBidder).

  // - the decryption proof does not correspond to the specific pairing of

  //   the ciphertext (highestBidder) and the cleartext (auctionWinner).

  FHE.checkSignatures(cts, cleartexts, decryptionProof);



  isPrizeDistributed = true;

  // Business logic to transfer the prize to the auction winner

}

This is a simplified example to demonstrate the functionality.

As you can see the in the above example, the path to move from an encrypted condition to a decrypted business logic must be async and requires an off-chain public decryption to reveal the result of the logic using encrypted variables.

Summary

FHE.select is a powerful tool for conditional logic on encrypted values.

Encrypted booleans (ebool) and values maintain confidentiality, enabling privacy-preserving logic.

Developers should account for gas costs and ciphertext behavior when designing conditional operations.

Previous
Logics
Next
Dealing with branches and conditions

Last updated 5 days ago

---

## 29. Dealing with branches and conditions | Solidity Guides | Protocol

_Source: https://docs.zama.org/protocol/solidity-guides/smart-contract/logics/loop_

Copy
SMART CONTRACT
LOGICS
Dealing with branches and conditions

This document explains how to handle branches, loops or conditions when working with Fully Homomorphic Encryption (FHE), specifically when the condition / index is encrypted.

Breaking a loop

❌ In FHE, it is not possible to break a loop based on an encrypted condition. For example, this would not work:

Copy
euint8 maxValue = FHE.asEuint(6); // Could be a value between 0 and 10

euint8 x = FHE.asEuint(0);

// some code

while(FHE.lt(x, maxValue)){

    x = FHE.add(x, 2);

}

If your code logic requires looping on an encrypted boolean condition, we highly suggest to try to replace it by a finite loop with an appropriate constant maximum number of steps and use FHE.select inside the loop.

Suggested approach

✅ For example, the previous code could maybe be replaced by the following snippet:

Copy
euint8 maxValue = FHE.asEuint(6); // Could be a value between 0 and 10

euint8 x;

// some code

for (uint32 i = 0; i < 10; i++) {

    euint8 toAdd = FHE.select(FHE.lt(x, maxValue), 2, 0);

    x = FHE.add(x, toAdd);

}

In this snippet, we perform 10 iterations, adding 4 to x in each iteration as long as the iteration count is less than maxValue. If the iteration count exceeds maxValue, we add 0 instead for the remaining iterations because we can't break the loop.

Best practices
Obfuscate branching

The previous paragraph emphasized that branch logic should rely as much as possible on FHE.select instead of decryptions. It hides effectively which branch has been executed.

However, this is sometimes not enough. Enhancing the privacy of smart contracts often requires revisiting your application's logic.

For example, if implementing a simple AMM for two encrypted ERC20 tokens based on a linear constant function, it is recommended to not only hide the amounts being swapped, but also the token which is swapped in a pair.

✅ Here is a very simplified example implementation, we suppose here that the rate between tokenA and tokenB is constant and equals to 1:

Copy
// typically either encryptedAmountAIn or encryptedAmountBIn is an encrypted null value

// ideally, the user already owns some amounts of both tokens and has pre-approved the AMM on both tokens

function swapTokensForTokens(

  externalEuint32 encryptedAmountAIn,

  externalEuint32 encryptedAmountBIn,

  bytes calldata inputProof

) external {

  euint32 encryptedAmountA = FHE.asEuint32(encryptedAmountAIn, inputProof); // even if amount is null, do a transfer to obfuscate trade direction

  euint32 encryptedAmountB = FHE.asEuint32(encryptedAmountBIn, inputProof); // even if amount is null, do a transfer to obfuscate trade direction



  // send tokens from user to AMM contract

  FHE.allowTransient(encryptedAmountA, tokenA);

  IConfidentialERC20(tokenA).transferFrom(msg.sender, address(this), encryptedAmountA);



  FHE.allowTransient(encryptedAmountB, tokenB);

  IConfidentialERC20(tokenB).transferFrom(msg.sender, address(this), encryptedAmountB);



  // send tokens from AMM contract to user

  // Price of tokenA in tokenB is constant and equal to 1, so we just swap the encrypted amounts here

  FHE.allowTransient(encryptedAmountB, tokenA);

  IConfidentialERC20(tokenA).transfer(msg.sender, encryptedAmountB);



  FHE.allowTransient(encryptedAmountA, tokenB);

  IConfidentialERC20(tokenB).transferFrom(msg.sender, address(this), encryptedAmountA);

}

Notice that to preserve confidentiality, we had to make two inputs transfers on both tokens from the user to the AMM contract, and similarly two output transfers from the AMM to the user, even if technically most of the times it will make sense that one of the user inputs encryptedAmountAIn or encryptedAmountBIn is actually an encrypted zero.

This is different from a classical non-confidential AMM with regular ERC20 tokens: in this case, the user would need to just do one input transfer to the AMM on the token being sold, and receive only one output transfer from the AMM on the token being bought.

Avoid using encrypted indexes

Using encrypted indexes to pick an element from an array without revealing it is not very efficient, because you would still need to loop on all the indexes to preserve confidentiality.

However, there are plans to make this kind of operation much more efficient in the future, by adding specialized operators for arrays.

For instance, imagine you have an encrypted array called encArray and you want to update an encrypted value x to match an item from this list, encArray[i], without disclosing which item you're choosing.

❌ You must loop over all the indexes and check equality homomorphically, however this pattern is very expensive in gas and should be avoided whenever possible.

Copy
euint32 x;

euint32[] encArray;



function setXwithEncryptedIndex(externalEuint32 encryptedIndex, bytes calldata inputProof) public {

    euint32 index = FHE.asEuint32(encryptedIndex, inputProof);

    for (uint32 i = 0; i < encArray.length; i++) {

        ebool isEqual = FHE.eq(index, i);

        x = FHE.select(isEqual, encArray[i], x);

    }

    FHE.allowThis(x);

}
Previous
Branching
Next
Error handling

Last updated 1 month ago

---

## 30. Error handling | Solidity Guides | Protocol

_Source: https://docs.zama.org/protocol/solidity-guides/smart-contract/logics/error_handling_

Copy
SMART CONTRACT
LOGICS
Error handling

This document explains how to handle errors effectively in FHEVM smart contracts. Since transactions involving encrypted data do not automatically revert when conditions are not met, developers need alternative mechanisms to communicate errors to users.

Challenges in error handling

In the context of encrypted data:

No automatic reversion: Transactions do not revert if a condition fails, making it challenging to notify users of issues like insufficient funds or invalid inputs.

Limited feedback: Encrypted computations lack direct mechanisms for exposing failure reasons while maintaining confidentiality.

Recommended approach: Error logging with a handler

To address these challenges, implement an error handler that records the most recent error for each user. This allows dApps or frontends to query error states and provide appropriate feedback to users.

Example implementation

The following contract snippet demonstrates how to implement and use an error handler:

Copy
struct LastError {

  euint8 error;      // Encrypted error code

  uint timestamp;    // Timestamp of the error

}



// Define error codes

euint8 internal NO_ERROR;

euint8 internal NOT_ENOUGH_FUNDS;



constructor() {

  NO_ERROR = FHE.asEuint8(0);           // Code 0: No error

  NOT_ENOUGH_FUNDS = FHE.asEuint8(1);   // Code 1: Insufficient funds

}



// Store the last error for each address

mapping(address => LastError) private _lastErrors;



// Event to notify about an error state change

event ErrorChanged(address indexed user);



/**

 * @dev Set the last error for a specific address.

 * @param error Encrypted error code.

 * @param addr Address of the user.

 */

function setLastError(euint8 error, address addr) private {

  _lastErrors[addr] = LastError(error, block.timestamp);

  emit ErrorChanged(addr);

}



/**

 * @dev Internal transfer function with error handling.

 * @param from Sender's address.

 * @param to Recipient's address.

 * @param amount Encrypted transfer amount.

 */

function _transfer(address from, address to, euint32 amount) internal {

  // Check if the sender has enough balance to transfer

  ebool canTransfer = FHE.le(amount, balances[from]);



  // Log the error state: NO_ERROR or NOT_ENOUGH_FUNDS

  setLastError(FHE.select(canTransfer, NO_ERROR, NOT_ENOUGH_FUNDS), msg.sender);



  // Perform the transfer operation conditionally

  balances[to] = FHE.add(balances[to], FHE.select(canTransfer, amount, FHE.asEuint32(0)));

  FHE.allowThis(balances[to]);

  FHE.allow(balances[to], to);



  balances[from] = FHE.sub(balances[from], FHE.select(canTransfer, amount, FHE.asEuint32(0)));

  FHE.allowThis(balances[from]);

  FHE.allow(balances[from], from);

}
How It Works

Define error codes:

NO_ERROR: Indicates a successful operation.

NOT_ENOUGH_FUNDS: Indicates insufficient balance for a transfer.

Record errors:

Use the setLastError function to log the latest error for a specific address along with the current timestamp.

Emit the ErrorChanged event to notify external systems (e.g., dApps) about the error state change.

Conditional updates:

Use the FHE.select function to update balances and log errors based on the transfer condition (canTransfer).

Frontend integration:

The dApp can query _lastErrors for a user’s most recent error and display appropriate feedback, such as "Insufficient funds" or "Transaction successful."

Example error query

The frontend or another contract can query the _lastErrors mapping to retrieve error details:

Copy
/**

 * @dev Get the last error for a specific address.

 * @param user Address of the user.

 * @return error Encrypted error code.

 * @return timestamp Timestamp of the error.

 */

function getLastError(address user) public view returns (euint8 error, uint timestamp) {

  LastError memory lastError = _lastErrors[user];

  return (lastError.error, lastError.timestamp);

}
Benefits of this approach

User feedback:

Provides actionable error messages without compromising the confidentiality of encrypted computations.

Scalable error tracking:

Logs errors per user, making it easy to identify and debug specific issues.

Event-driven notifications:

Enables frontends to react to errors in real time via the ErrorChanged event.

By implementing error handlers as demonstrated, developers can ensure a seamless user experience while maintaining the privacy and integrity of encrypted data operations.

Previous
Dealing with branches and conditions
Next
Decryption

Last updated 1 month ago

---

## 31. Decryption | Solidity Guides | Protocol

_Source: https://docs.zama.org/protocol/solidity-guides/smart-contract/oracle_

Copy
SMART CONTRACT
Decryption
Public Decryption

This section explains how to handle public decryption in FHEVM. Public decryption allows plaintext data to be accessed when required for contract logic or user presentation, ensuring confidentiality is maintained throughout the process.

Public decryption is essential in two primary cases:

Smart contract logic: A contract requires plaintext values for computations or decision-making.

User interaction: Plaintext data needs to be revealed to all users, such as revealing the decision of the vote.

Overview

Public decryption of a confidential on-chain result is designed as an asynchronous three-steps process that splits the work between the blockchain (on-chain) and off-chain execution environments.

Step 1: On-Chain Setup - Enabling Permanent Public Access

This step is executed by the smart contract using the FHE Solidity library to signal that a specific confidential result is ready to be revealed.

FHE Solidity Library Function: FHE.makePubliclyDecryptable

Action: The contract sets the ciphertext handle's status as publicly decryptable, globally and permanently authorizing any entity to request its off-chain cleartext value.

Result: The ciphertext is now accessible to any entity, which can request its decryption from the Zama off-chain Relayer.

Step 2: Off-chain Decryption - Decryption and Proof Generation

This step can be executed by any off-chain client using the Relayer SDK.

Relayer SDK Function: FhevmInstance.publicDecrypt

Action: The off-chain client submits the ciphertext handle to the Zama Relayer's Key Management System (KMS).

Result: The Zama Relayer returns three items:

The cleartext (the decrypted value).

The ABI-encoding of that cleartext.

A Decryption Proof (a byte array of signatures and metadata) that serves as a cryptographic guarantee that the cleartext is the authentic, unmodified result of the decryption performed by the KMS.

Step 3: On-Chain Verification - Submit and Guarantee Authenticity

This final step is executed on-chain by the contrat using the FHE Solidity library with the proof generated off-chain to ensure the cleartext submitted to the contract is trustworthy.

FHE Solidity Library Function: FHE.checkSignatures

Action: The caller submits the cleartext and decryption proof back to a contract function. The contract calls FHE.checkSignatures, which reverts the transaction if the proof is invalid or does not match the cleartext/ciphertext pair.

Result: The receiving contract gains a cryptographic guarantee that the submitted cleartext is the authentic decrypted value of the original ciphertext. The contract can then securely execute its business logic (e.g., reveal a vote, transfer funds, update state).

Tutorial

This tutorial provides a deep dive into the three-step asynchronous public decryption process required to finalize a confidential on-chain computation by publicly revealing its result.

The Solidity contract provided below, FooBarContract, is used to model this entire workflow. The contract's main function runFooBarConfidentialLogic simulates the execution of a complex confidential computation (e.g., calculating a winner or a final price) that results in 2 encrypted final values (ciphertexts) _encryptedFoo and _encryptedBar.

Then, in order to finalize the workflow, the FooBarContract needs the decrypted clear values of both _encryptedFoo and _encryptedBar to decide whether to trigger some finalization logic (e.g. reveal a vote, transfer funds). The FooBarContract's function _runFooBarClearBusinessLogicFinalization simulates this step. Since the FHEVM prevents direct on-chain decryption, the process must shift to an off-chain decryption phase, which presents a challenge: How can the FooBarContract trust that the cleartext submitted back to the chain is the authentic, unmodified result of the decryption of both _encryptedFoo and _encryptedBar?

This is where the off-chain publicDecrypt function and the on-chain checkSignatures function come into play.

The Solidity Contract
Copy
pragma solidity ^0.8.24;



import "@fhevm/solidity/lib/FHE.sol";

import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";



contract FooBarContract is ZamaEthereumConfig {

  ebool _encryptedFoo;

  euint8 _encryptedBar;

  bool _clearFoo;

  uint8 _clearBar;

  bool _isFinalized;



  event ClearFooBarRequested(ebool encryptedFoo, euint8 encryptedBar);



  constructor() {}



  function _isFooBarConfidentialLogicExecuted() private returns (bool) {

    return FHE.isInitialized(_encryptedFoo) && FHE.isInitialized(_encryptedBar);

  }



  modifier whenConfidentialLogicExecuted() {

    require(_isFooBarConfidentialLogicExecuted(), "foo confidential logic not yet executed!")

    _;

  }



  function runFooBarConfidentialLogic() external {

    require(!_isFooBarConfidentialLogicExecuted(), "foobar confidential logic already executed!")

    _encryptedFoo = FHE.randEbool();

    _encryptedBar = FHE.randEuint8();

  }



  function getEncryptedFoo() public whenConfidentialLogicExecuted returns (ebool) {

    return _encryptedFoo;

  }



  function getEncryptedBar() public whenConfidentialLogicExecuted returns (euint8) {

    return _encryptedBar;

  }



  function requestClearFooBar() external whenConfidentialLogicExecuted {

    FHE.makePubliclyDecryptable(_encryptedFoo);

    FHE.makePubliclyDecryptable(_encryptedBar);



    emit ClearFooBarRequested(_encryptedFoo, _encryptedBar);

  }



  function finalizeClearFooBar(bool clearFoo, uint8 clearBar, bytes memory publicDecryptionProof) external whenConfidentialLogicExecuted {

    require(!_isFinalized, "foo is already revealed");



    // ⚠️ Crucial Ordering Constraint

    // ==============================

    // The decryption proof is cryptographically bound to the specific ORDER of handles.

    // A proof computed for `[efoo, ebar]` will be different

    // from a proof computed for `[ebar, efoo]`.

    //

    // Here we expect a proof computed for `[efoo, ebar]`

    //

    bytes32[] memory ciphertextEfooEbar = new bytes32[](2);

    ciphertextEfooEbar[0] = FHE.toBytes32(_encryptedFoo);

    ciphertextEfooEbar[1] = FHE.toBytes32(_encryptedBar);



    // ⚠️ Once again, the order is critical to compute the ABI encoded array of clear values

    // The order must match the order in ciphertextEfooEbar: (efoo, ebar)

    bytes memory abiClearFooClearBar = abi.encode(clearFoo, clearBar);

    FHE.checkSignatures(ciphertextEfooEbar, abiClearFooClearBar, publicDecryptionProof);



    _isFinalized = true;



    _runFooBarClearBusinessLogicFinalization();

  }



  function _runFooBarClearBusinessLogicFinalization() private {

    // Business logic starts here.

    // Transfer ERC20, releave price or winner etc.

  }

}
1
Run On-Chain Confidential Logic

We first execute the on-chain confidential logic using a TypeScript client. This simulates the initial phase of the confidential computation.

Copy
const tx = await contract.runFooBarConfidentialLogic();

await tx.wait();
2
Run On-Chain Request Clear Values

With the confidential logic complete, the next step is to execute the on-chain function that requests and enables public decryption of the computed encrypted values _encryptedFoo and _encryptedBar. In a production scenario, we might use a Solidity event to notify the off-chain client that the necessary encrypted values are ready for off-chain public decryption.

Copy
const tx = await contract.requestClearFooBar();

const txReceipt = await tx.wait();

const { efoo, ebar } = parseClearFooBarRequestedEvent(contract, txReceipt);
3
Run Off-Chain Public Decryption

Now that the ciphertexts are marked as publicly decryptable, we call the off-chain function publicDecrypt using the relayer-sdk. This fetches the clear values along with the Zama KMS decryption proof required for the final on-chain verification.

Crucial Ordering Constraint: The decryption proof is cryptographically bound to the specific order of handles passed in the input array. The proof computed for [efoo, ebar] is different from the proof computed for [ebar, efoo].

Copy
const instance: FhevmInstance = await createInstance();

const results: PublicDecryptResults = await instance.publicDecrypt([efoo, ebar]);

const clearFoo = results.values[efoo];

const clearBar = results.values[ebar];

// Warning! The decryption proof is computed for [efoo, ebar], NOT [ebar, efoo]!

const decryptionProof: `0x${string}` = results.decryptionProof;
4
Run On-Chain

On the client side, we have computed all the clear values and, crucially, obtained the associated decryption proof. We can now securely move on to the final step: sending this data on-chain to trigger verification and final business logic simulated in the _runFooBarClearBusinessLogicFinalization contract function. If verification succeeds, the contract securely executes the _runFooBarClearBusinessLogicFinalization (e.g., transfers funds, publishes the vote result, etc.), completing the full confidential workflow.

Copy
const tx = await contract.finalizeClearFooBar(clearFoo, clearBar, results.decryptionProof);

const txReceipt = await tx.wait();
Public Decryption On-Chain & Off-Chain API
On-chain FHE.makePubliclyDecryptable function

The contract sets the ciphertext handle's status as publicly decryptable, globally and permanently authorizing any entity to request its off-chain cleartext value. Note the calling contract must have ACL permission to access the handle in the first place.

Copy
function makePubliclyDecryptable(ebool value) internal;

function makePubliclyDecryptable(euint8 value) internal;

function makePubliclyDecryptable(euint16 value) internal;

...

function makePubliclyDecryptable(euint256 value) internal;

Function arguments

Function return

This function has no return value

Off-chain relayer-sdk publicDecrypt function

The relayer-sdk publicDecrypt function is defined as follow:

Copy
export type PublicDecryptResults = {

  clearValues: Record<`0x${string}`, bigint | boolean | `0x${string}`>;

  abiEncodedClearValues: `0x${string}`;

  decryptionProof: `0x${string}`;

};

export type FhevmInstance = {

  //...

  publicDecrypt: (handles: (string | Uint8Array)[]) => Promise<PublicDecryptResults>;

  //...

};

Function arguments

Argument
Description
Constraints

handles

The list of ciphertext handles (represented as bytes32 values) to decrypt.

These handles must correspond to ciphertexts that have been marked as publicly decryptable on-chain.

Function return type PublicDecryptResults

The function returns an object containing the three essential components required for the final on-chain verification in Step 3 of the public decryption workflow:

Property
Type
Description
On-Chain usage

clearValues

Record<0x${string}, bigint | boolean | 0x${string}>

An object mapping each input ciphertext handle to its raw decrypted cleartext value.

N/A

abiEncodedClearValues

0x${string}

The ABI-encoded byte string of all decrypted cleartext values, preserving the exact order of the input handles list.

abiEncodedCleartexts argument when calling the on-chain FHE.checkSignatures

decryptionProof

0x${string}

A byte array containing the KMS cryptographic signatures and necessary metadata that proves the decryption was legitimately performed.

decryptionProof argument when calling the on-chain FHE.checkSignatures

On-chain FHE.checkSignatures function
Copy
function checkSignatures(bytes32[] memory handlesList, bytes memory abiEncodedCleartexts, bytes memory decryptionProof) internal

Function arguments

Argument
Description
Constraint

handlesList

The list of ciphertext handles (represented as bytes32 values) whose decryption is being verified.

Must contain the exact same number of elements as the cleartext values in abiEncodedCleartexts.

abiEncodedCleartexts

The ABI encoding of the decrypted cleartext values associated with the handles. (Use abi.encode to prepare this argument.)

Order is critical: The i-th value in this encoding must be the cleartext that corresponds to the i-th handle in handlesList. Types must match.

decryptionProof

A byte array containing the KMS cryptographic signatures and necessary metadata that prove the off-chain decryption was performed by the authorized Zama Key Management System.

This proof is generated by the Zama KMS and is obtained via the relayer-sdk.publicDecrypt function.

Function return

This function has no return value and simply reverts if the proof verification failed.

Notice that the callback should always verify the signatures and implement a replay protection mechanism (see below).

Previous
Error handling
Next
Hardhat plugin

Last updated 5 days ago

---

## 32. Hardhat plugin | Solidity Guides | Protocol

_Source: https://docs.zama.org/protocol/solidity-guides/development-guide/hardhat_

Copy
DEVELOPMENT GUIDE
Hardhat plugin

This section will guide you through writing and testing FHEVM smart contracts in Solidity using Hardhat.

The FHEVM Hardhat Plugin

To write FHEVM smart contracts using Hardhat, you need to install the FHEVM Hardhat Plugin in your Hardhat project.

This plugin enables you to develop, test, and interact with FHEVM contracts right out of the box.

It extends Hardhat’s functionality with a complete FHEVM API that allows you:

Encrypt data

Decrypt data

Run tests using various FHEVM execution modes

Write FHEVM-enabled Hardhat Tasks

Where to go next

🟨 Go to Setup Hardhat to initialize your FHEVM Hardhat project.

🟨 Go to Write FHEVM Tests in Hardhat for details on writing tests of FHEVM smart contracts using Hardhat.

🟨 Go to Run FHEVM Tests in Hardhat to learn how to execute those tests in different FHEVM environments.

🟨 Go to Write FHEVM Hardhat Task to learn how to write your own custom FHEVM Hardhat task.

Previous
Decryption
Next
Write FHEVM tests in Hardhat

Last updated 1 month ago

---

## 33. Write FHEVM tests in Hardhat | Solidity Guides | Protocol

_Source: https://docs.zama.org/protocol/solidity-guides/development-guide/hardhat/write_test_

Copy
DEVELOPMENT GUIDE
HARDHAT PLUGIN
Write FHEVM tests in Hardhat

In this section, you'll find everything you need to set up a new Hardhat project and start developing FHEVM smart contracts from scratch using the FHEVM Hardhat Plugin

Enabling the FHEVM Hardhat Plugin in your Hardhat project

Like any Hardhat plugin, the FHEVM Hardhat Plugin must be enabled by adding the following import statement to your hardhat.config.ts file:

Copy
import "@fhevm/hardhat-plugin";

Without this import, the Hardhat FHEVM API will not be available in your Hardhat runtime environment (HRE).

Accessing the Hardhat FHEVM API

The plugin extends the standard Hardhat Runtime Environment (or hre in short) with the new fhevm Hardhat module.

You can access it in either of the following ways:

Copy
import { fhevm } from "hardhat";

or

Copy
import * as hre from "hardhat";



// Then access: hre.fhevm
Encrypting Values Using the Hardhat FHEVM API

Suppose the FHEVM smart contract you want to test has a function called foo that takes an encrypted uint32 value as input. The Solidity function foo should be declared as follows:

Copy
function foo(externalEunit32 value, bytes calldata memory inputProof);

Where:

externalEunit32 value : is a bytes32 representing the encrypted uint32

bytes calldata memory inputProof : is a bytes array representing the zero-knowledge proof of knowledge that validates the encryption

To compute these arguments in TypeScript, you need:

The address of the target smart contract

The signer’s address (i.e., the account sending the transaction)

1

Create a new encryted input

Copy
// use the `fhevm` API module from the Hardhat Runtime Environment

const input = fhevm.createEncryptedInput(contractAddress, signers.alice.address);
2

Add the value you want to encrypt.

Copy
input.add32(12345);
3

Perform local encryption.

Copy
const encryptedInputs = await input.encrypt();
4

Call the Solidity function

Copy
const externalUint32Value = encryptedInputs.handles[0];

const inputProof = encryptedInputs.proof;



const tx = await input.foo(externalUint32Value, inputProof);

await tx.wait();
Encryption examples

Basic encryption examples

FHECounter

Decrypting values using the Hardhat FHEVM API

Suppose user Alice wants to decrypt a euint32 value that is stored in a smart contract exposing the following Solidity view function:

Copy
function getEncryptedUint32Value() public view returns (euint32) { returns _encryptedUint32Value; }

For simplicity, we assume that both Alice’s account and the target smart contract already have the necessary FHE permissions to decrypt this value. For a detailed explanation of how FHE permissions work, see the initializeUint32() function in DecryptSingleValue.sol.

1

Retrieve the encrypted value (a bytes32 handle) from the smart contract:

Copy
const encryptedUint32Value = await contract.getEncryptedUint32Value();
2

Perform the decryption using the FHEVM API:

Copy
const clearUint32Value = await fhevm.userDecryptEuint(

  FhevmType.euint32, // Encrypted type (must match the Solidity type)

  encryptedUint32Value, // bytes32 handle Alice wants to decrypt

  contractAddress, // Target contract address

  signers.alice, // Alice’s wallet

);

If either the target smart contract or the user does NOT have FHE permissions, then the decryption call will fail!

Supported Decryption Types

Use the appropriate function for each encrypted data type:

Type
Function

euintXXX

fhevm.userDecryptEuint(...)

ebool

fhevm.userDecryptEbool(...)

eaddress

fhevm.userDecryptEaddress(...)

Decryption examples

Basic decryption examples

FHECounter

Previous
Hardhat plugin
Next
Deploy contracts and run tests

Last updated 1 month ago

---

## 34. Deploy contracts and run tests | Solidity Guides | Protocol

_Source: https://docs.zama.org/protocol/solidity-guides/development-guide/hardhat/run_test_

Copy
DEVELOPMENT GUIDE
HARDHAT PLUGIN
Deploy contracts and run tests

In this section, you'll find everything you need to test your FHEVM smart contracts in your Hardhat project.

FHEVM Runtime Modes

The FHEVM Hardhat plugin provides three FHEVM runtime modes tailored for different stages of contract development and testing. Each mode offers a trade-off between speed, encryption, and persistence.

The Hardhat (In-Memory) default network: 🧪 Uses mock encryption. Ideal for regular tests, CI test coverage, and fast feedback during early contract development. No real encryption is used.

The Hardhat Node (Local Server) network: 🧪 Uses mock encryption. Ideal when you need persistent state - for example, when testing frontend interactions, simulating user flows, or validating deployments in a realistic local environment. Still uses mock encryption.

The Sepolia Testnet network: 🔐 Uses real encryption. Use this mode once your contract logic is stable and validated locally. This is the only mode that runs on the full FHEVM stack with real encrypted values. It simulates real-world production conditions but is slower and requires Sepolia ETH.

Zama Testnet is not a blockchain itself. It is a protocol that enables you to run confidential smart contracts on existing blockchains (such as Ethereum, Base, and others) with the support of encrypted types. See the FHE on blockchain guide to learn more about the protocol architecture.

Currently, Zama Protocol is available on the Sepolia Testnet. Support for additional chains will be added in the future. See the roadmap↗

Summary
Mode
Encryption
Persistent
Chain
Speed
Usage

Hardhat (default)

🧪 Mock

❌ No

In-Memory

⚡⚡ Very Fast

Fast local testing and coverage

Hardhat Node

🧪 Mock

✅ Yes

Server

⚡ Fast

Frontend integration and local persistent testing

Sepolia Testnet

🔐 Real Encryption

✅ Yes

Server

🐢 Slow

Full-stack validation with real encrypted data

The FHEVM Hardhat Template

To demonstrate the three available testing modes, we'll use the fhevm-hardhat-template, which comes with the FHEVM Hardhat Plugin pre-installed, a basic FHECounter smart contract, and ready-to-use tasks for interacting with a deployed instance of this contract.

Run on Hardhat (default)

To run your tests in-memory using FHEVM mock values, simply run the following:

Copy
npx hardhat test --network hardhat
Run on Hardhat Node

You can also run your tests against a local Hardhat node, allowing you to deploy contract instances and interact with them in a persistent environment.

1

Launch the Hardhat Node server:

Open a new terminal window.

From the root project directory, run the following:

Copy
npx hardhat node
2

Run your test suite (optional):

From the root project directory:

Copy
npx hardhat test --network localhost
3

Deploy the FHECounter smart contract on Hardhat Node

From the root project directory:

Copy
npx hardhat deploy --network localhost

Check the deployed contract FHEVM configuration:

Copy
npx hardhat fhevm check-fhevm-compatibility --network localhost --address <deployed contract address>
4

Interact with the deployed FHECounter smart contract

From the root project directory:

Decrypt the current counter value:

Copy
npx hardhat --network localhost task:decrypt-count

Increment the counter by 1:

Copy
npx hardhat --network localhost task:increment --value 1

Decrypt the new counter value:

Copy
npx hardhat --network localhost task:decrypt-count
Run on Sepolia Ethereum Testnet

To test your FHEVM smart contract using real encrypted values, you can run your tests on the Sepolia Testnet.

1

Rebuild the project for Sepolia

From the root project directory:

Copy
npx hardhat clean

npx hardhat compile --network sepolia
2

Deploy the FHECounter smart contract on Sepolia

Copy
npx hardhat deploy --network sepolia
3

Check the deployed FHECounter contract FHEVM configuration

From the root project directory:

Copy
npx hardhat fhevm check-fhevm-compatibility --network sepolia --address <deployed contract address>

If an internal exception is raised, it likely means the contract was not properly compiled for the Sepolia network.

4

Interact with the deployed FHECounter contract

From the root project directory:

Decrypt the current counter value (⏳ wait...):

Copy
npx hardhat --network sepolia task:decrypt-count

Increment the counter by 1 (⏳ wait...):

Copy
npx hardhat --network sepolia task:increment --value 1

Decrypt the new counter value (⏳ wait...):

Copy
npx hardhat --network sepolia task:decrypt-count
Previous
Write FHEVM tests in Hardhat
Next
Write FHEVM-enabled Hardhat Tasks

Last updated 1 month ago

---

## 35. Write FHEVM-enabled Hardhat Tasks | Solidity Guides | Protocol

_Source: https://docs.zama.org/protocol/solidity-guides/development-guide/hardhat/write_task_

Copy
DEVELOPMENT GUIDE
HARDHAT PLUGIN
Write FHEVM-enabled Hardhat Tasks

In this section, you'll learn how to write a custom FHEVM Hardhat task.

Writing tasks is a gas-efficient and flexible way to test your FHEVM smart contracts on the Sepolia network. Creating a custom task is straightforward.

Prerequisite

You should be familiar with Hardhat tasks. If you're new to them, refer to the Hardhat Tasks official documentation.

You should have already completed the FHEVM Tutorial.

This page provides a step-by-step walkthrough of the task:decrypt-count tasks included in the file tasks/FHECounter.ts file, located in the fhevm-hardhat-template repository.

1
A Basic Hardhat Task.

Let’s start with a simple example: fetching the current counter value from a basic Counter.sol contract.

If you're already familiar with Hardhat and custom tasks, the TypeScript code below should look familiar and be easy to follow:

Copy
task("task:get-count", "Calls the getCount() function of Counter Contract")

  .addOptionalParam("address", "Optionally specify the Counter contract address")

  .setAction(async function (taskArguments: TaskArguments, hre) {

    const { ethers, deployments } = hre;



    const CounterDeployement = taskArguments.address

      ? { address: taskArguments.address }

      : await deployments.get("Counter");

    console.log(`Counter: ${CounterDeployement.address}`);



    const counterContract = await ethers.getContractAt("Counter", CounterDeployement.address);



    const clearCount = await counterContract.getCount();



    console.log(`Clear count    : ${clearCount}`);

});

Now, let’s modify this task to work with FHEVM encrypted values.

2
Comment Out Existing Logic and rename

First, comment out the existing logic so we can incrementally add the necessary changes for FHEVM integration.

Copy
task("task:get-count", "Calls the getCount() function of Counter Contract")

  .addOptionalParam("address", "Optionally specify the Counter contract address")

  .setAction(async function (taskArguments: TaskArguments, hre) {

    // const { ethers, deployments } = hre;



    // const CounterDeployement = taskArguments.address

    //   ? { address: taskArguments.address }

    //   : await deployments.get("Counter");

    // console.log(`Counter: ${CounterDeployement.address}`);



    // const counterContract = await ethers.getContractAt("Counter", CounterDeployement.address);



    // const clearCount = await counterContract.getCount();



    // console.log(`Clear count    : ${clearCount}`);

});

Next, rename the task by replacing:

Copy
task("task:get-count", "Calls the getCount() function of Counter Contract")

With:

Copy
task("task:decrypt-count", "Calls the getCount() function of Counter Contract")

This updates the task name from task:get-count to task:decrypt-count, reflecting that it now includes decryption logic for FHE-encrypted values.

3
Initialize FHEVM CLI API

Replace the line:

Copy
    // const { ethers, deployments } = hre;

With:

Copy
    const { ethers, deployments, fhevm } = hre;



    await fhevm.initializeCLIApi();

Calling initializeCLIApi() is essential. Unlike built-in Hardhat tasks like test or compile, which automatically initialize the FHEVM runtime environment, custom tasks require you to call this function explicitly. Make sure to call it at the very beginning of your task to ensure the environment is properly set up.

4
Call the view function getCount from the FHECounter contract

Replace the following commented-out lines:

Copy
    // const CounterDeployement = taskArguments.address

    //   ? { address: taskArguments.address }

    //   : await deployments.get("Counter");

    // console.log(`Counter: ${CounterDeployement.address}`);



    // const counterContract = await ethers.getContractAt("Counter", CounterDeployement.address);



    // const clearCount = await counterContract.getCount();

With the FHEVM equivalent:

Copy
    const FHECounterDeployement = taskArguments.address

      ? { address: taskArguments.address }

      : await deployments.get("FHECounter");

    console.log(`FHECounter: ${FHECounterDeployement.address}`);



    const fheCounterContract = await ethers.getContractAt("FHECounter", FHECounterDeployement.address);



    const encryptedCount = await fheCounterContract.getCount();

    if (encryptedCount === ethers.ZeroHash) {

      console.log(`encrypted count: ${encryptedCount}`);

      console.log("clear count    : 0");

      return;

    }

Here, encryptedCount is an FHE-encrypted euint32 primitive. To retrieve the actual value, we need to decrypt it in the next step.

5
Decrypt the encrypted count value.

Now replace the following commented-out line:

Copy
    // console.log(`Clear count    : ${clearCount}`);

With the decryption logic:

Copy
    const signers = await ethers.getSigners();

    const clearCount = await fhevm.userDecryptEuint(

      FhevmType.euint32,

      encryptedCount,

      FHECounterDeployement.address,

      signers[0],

    );

    console.log(`Encrypted count: ${encryptedCount}`);

    console.log(`Clear count    : ${clearCount}`);

At this point, your custom Hardhat task is fully configured to work with FHE-encrypted values and ready to run!

6
Step 6: Run your custom task using Hardhat Node

Start the Local Hardhat Node:

Open a new terminal window.

From the root project directory, run the following:

Copy
npx hardhat node

Deploy the FHECounter smart contract on the local Hardhat Node

Copy
npx hardhat deploy --network localhost

Run your custom task

Copy
npx hardhat task:decrypt-count --network localhost
7
Step 7: Run your custom task using Sepolia

Deploy the FHECounter smart contract on Sepolia Testnet (if not already deployed)

Copy
npx hardhat deploy --network sepolia

Execute your custom task

Copy
npx hardhat task:decrypt-count --network sepolia
Previous
Deploy contracts and run tests
Next
Foundry

Last updated 1 month ago

---

## 36. Foundry | Solidity Guides | Protocol

_Source: https://docs.zama.org/protocol/solidity-guides/development-guide/foundry_

Copy
DEVELOPMENT GUIDE
Foundry

This guide explains how to use Foundry with FHEVM for developing smart contracts.

While a Foundry template is currently in development, we strongly recommend using the Hardhat template) for now, as it provides a fully tested and supported development environment for FHEVM smart contracts.

However, you could still use Foundry with the mocked version of the FHEVM, but please be aware that this approach is NOT recommended, since the mocked version is not fully equivalent to the real FHEVM node's implementation (see warning in hardhat). In order to do this, you will need to rename your FHE.sol imports from @fhevm/solidity/lib/FHE.sol to fhevm/mocks/FHE.sol in your solidity source files.

Previous
Write FHEVM-enabled Hardhat Tasks
Next
HCU

Last updated 1 month ago

---

## 37. HCU | Solidity Guides | Protocol

_Source: https://docs.zama.org/protocol/solidity-guides/development-guide/hcu_

Copy
DEVELOPMENT GUIDE
HCU

This guide explains how to use Fully Homomorphic Encryption (FHE) operations in your smart contracts on FHEVM. Understanding HCU is critical for designing efficient confidential smart contracts.

Overview

FHE operations in FHEVM are computationally intensive compared to standard Ethereum operations, as they require complex mathematical computations to maintain privacy and security. To manage computational load and prevent potential denial-of-service attacks, FHEVM implements a metering system called Homomorphic Complexity Units ("HCU").

To represent this complexity, we introduced the Homomorphic Complexity Unit ("HCU"). In Solidity, each FHE operation consumes a set amount of HCU based on the operational computational complexity for hardware computation. Since FHE transactions are symbolic, this helps preventing resource exhaustion outside of the blockchain.

To do so, there is a contract named HCULimit, which monitors HCU consumption for each transaction and enforces two key limits:

Sequential homomorphic operations depth limit per transaction: Controls HCU usage for operations that must be processed in order.

Global homomorphic operations complexity per transaction: Controls HCU usage for operations that can be processed in parallel.

If either limit is exceeded, the transaction will revert.

HCU limit

The current devnet has an HCU limit of 20,000,000 per transaction and an HCU depth limit of 5,000,000 per transaction. If either HCU limit is exceeded, the transaction will revert.

To resolve this, you must do one of the following:

Refactor your code to reduce the number of FHE operations in your transaction.

Split your FHE operations across multiple independent transactions.

HCU costs for common operations
Boolean operations (ebool)
Function name
HCU (scalar)
HCU (non-scalar)

and

22,000

25,000

or

22,000

24,000

xor

2,000

22,000

not

-

2

select

-

55,000

randEbool

-

19,000

Unsigned integer operations

HCU increase with the bit-width of the encrypted integer type. Below are the detailed costs for various operations on encrypted types.

8-bit Encrypted integers (euint8)
Function name
HCU (scalar)
HCU (non-scalar)

add

84,000

88,000

sub

84,000

91,000

mul

122,000

150,000

div

210,000

-

rem

440,000

-

and

31,000

31,000

or

30,000

30,000

xor

31,000

31,000

shr

32,000

91,000

shl

32,000

92,000

rotr

31,000

93,000

rotl

31,000

91,000

eq

55,000

55,000

ne

55,000

55,000

ge

52,000

63,000

gt

52,000

59,000

le

58,000

58,000

lt

52,000

59,000

min

84,000

119,000

max

89,000

121,000

neg

-

79,000

not

-

9

select

-

55,000

randEuint8

-

23,000

16-bit Encrypted integers (euint16)
Function name
HCU (scalar)
HCU (non-scalar)

add

93,000

93,000

sub

93,000

93,000

mul

193,000

222,000

div

302,000

-

rem

580,000

-

and

31,000

31,000

or

30,000

31,000

xor

31,000

31,000

shr

32,000

123,000

shl

32,000

125,000

rotr

31,000

125,000

rotl

31,000

125,000

eq

55,000

83,000

ne

55,000

83,000

ge

55,000

84,000

gt

55,000

84,000

le

58,000

83,000

lt

58,000

84,000

min

88,000

146,000

max

89,000

145,000

neg

-

93,000

not

-

16

select

-

55,000

randEuint16

-

23,000

32-bit Encrypted Integers (euint32)
Function name
HCU (scalar)
HCU (non-scalar)

add

95,000

125,000

sub

95,000

125,000

mul

265,000

328,000

div

438,000

-

rem

792,000

-

and

32,000

32,000

or

32,000

32,000

xor

32,000

32,000

shr

32,000

163,000

shl

32,000

162,000

rotr

32,000

160,000

rotl

32,000

163,000

eq

82,000

86,000

ne

83,000

85,000

ge

84,000

118,000

gt

84,000

118,000

le

84,000

117,000

lt

83,000

117,000

min

117,000

182,000

max

117,000

180,000

neg

-

131,000

not

-

32

select

-

55,000

randEuint32

-

24,000

64-bit Encrypted integers (euint64)
Function name
HCU (scalar)
HCU (non-scalar)

add

133,000

162,000

sub

133,000

162,000

mul

365,000

596,000

div

715,000

-

rem

1,153,000

-

and

34,000

34,000

or

34,000

34,000

xor

34,000

34,000

shr

34,000

209,000

shl

34,000

208,000

rotr

34,000

209,000

rotl

34,000

209,000

eq

83,000

120,000

ne

84,000

118,000

ge

116,000

152,000

gt

117,000

152,000

le

119,000

149,000

lt

118,000

146,000

min

150,000

219,000

max

149,000

218,000

neg

-

131,000

not

-

63

select

-

55,000

randEuint64

-

24,000

128-bit Encrypted integers (euint128)
Function name
HCU (scalar)
HCU (non-scalar)

add

172,000

259,000

sub

172,000

260,000

mul

696,000

1,686,000

div

1,225,000

-

rem

1,943,000

-

and

37,000

37,000

or

37,000

37,000

xor

37,000

37,000

shr

37,000

272,000

shl

37,000

272,000

rotr

37,000

283,000

rotl

37,000

278,000

eq

117,000

122,000

ne

117,000

122,000

ge

149,000

210,000

gt

150,000

218,000

le

150,000

218,000

lt

149,000

215,000

min

186,000

289,000

max

180,000

290,000

neg

-

168,000

not

-

130

select

-

57,000

randEuint128

-

25,000

256-bit Encrypted integers (euint256)
Function name
HCU (scalar)
HCU (non-scalar)

and

38,000

38,000

or

38,000

38,000

xor

39,000

39,000

shr

38,000

369,000

shl

39,000

378,000

rotr

40,000

375,000

rotl

38,000

378,000

eq

118,000

152,000

ne

117,000

150,000

neg

-

269,000

not

-

130

select

-

108,000

randEuint256

-

30,000

Encrypted addresses (euint160)

When using eaddress (internally represented as euint160), the HCU costs for equality and inequality checks and select are as follows:

Function name
HCU (scalar)
HCU (non-scalar)

eq

115,000

125,000

ne

115,000

124,000

select

-

83,000

Additional Operations
Function name
HCU

cast

32

trivialEncrypt

32

randBounded

23,000-30,000

Previous
Foundry
Next
Migrate to v0.9

Last updated 1 month ago

---

## 38. Migrate to v0.9 | Solidity Guides | Protocol

_Source: https://docs.zama.org/protocol/solidity-guides/development-guide/migration_

Copy
DEVELOPMENT GUIDE
Migrate to v0.9

FHEVM v0.9 introduces major architectural changes, including:

Removal of the Zama Oracle

Introduction of a self-relaying public decryption workflow

Unified ZamaEthereumConfig replacing SepoliaConfig

This guide explains what changed and how to migrate your project smoothly.

What Changed in FHEVM v0.9?

Before diving into migration steps, it’s important to understand the main breaking change: public decryption is no longer handled by a Zama Oracle, but by your dApp’s off-chain logic.

FHEVM v0.8 Oracle-Based Decryption

In FHEVM v0.8, the decryption process relies on a trusted Oracle to relay the decryption request and proof between the dApp and the Zama Key Management System (KMS). This approach abstracts the complexity but introduces an external dependency.

Decryption Steps:

Step
Component
Action

1.

dApp (Solidity)

Calls FHE.requestDecryption() to signal a need for clear data.

2.

Oracle

Listens for the on-chain decryption request event.

3.

Oracle (Off-chain)

Performs the publicDecryption with the Zama KMS, retrieving the clear values and the decryption proof.

4.

Oracle

Calls the user-specified dApp callback Solidity function with the clear values and the associated proof.

5.

dApp (Solidity Callback)

Calls FHE.verifySignatures() to verify the authenticity of the clear values using the provided proof.

Key takeaway for v0.8: The Oracle is the trusted intermediary responsible for performing the off-chain decryption and submitting the result back to the dApp contract.

FHEVM v0.9 Self-Relaying Decryption & dApp Responsibility

The FHEVM v0.9 architecture shifts to a self-relaying model, empowering the dApp client (the user) to execute the off-chain decryption and re-submission. This decentralizes the process and removes the dependency on a general-purpose Oracle.

Example Scenario: Checking a Player's Encrypted Score

Consider a Game contract where Alice's final score is stored encrypted on-chain. Alice needs to prove her clear score to claim a reward.

Step
Component
Action

1.

Game Contract (Solidity)

An on-chain function is called to make Alice's encrypted score publicly decryptable.

2.

Alice (Client/Off-chain)

Alice fetches the publicly decryptable encrypted score from the Game contract.

3.

Alice (Client/Off-chain)

Alice or any third-party service uses the @zama-fhe/relayer-sdk to call the off-chain publicDecrypt function. This returns the clear score value and a proof of decryption.

4.

Alice (Client/On-chain)

Alice calls a function on the Game contract with the decrypted clear score and the proof.

5.

Game Contract (Solidity)

The contract calls FHE.verifySignatures() to verify the score's validity using the provided proof.

6.

Game Contract (Solidity)

If the score is valid, the contract executes the game logic (e.g., distributing Alice's prize).

Key takeaway for FHEVM v0.9: Decryption is a user-driven, off-chain process. The dApp client is responsible for off-chain decryption, fetching the proof, and relaying the result back on-chain for verification.

Why this matters: If your dApp previously relied on the Oracle, you must rewrite your decryption flow. The migration steps below guide you through this change.

Migration Checklist

Here is a brief, ordered list of the steps required to successfully migrate your project to FHEVM v0.9:

Update Dependencies: Upgrade all key Zama FHE packages to their FHEVM v0.9 versions.

Update Solidity Config: Replace the removed SepoliaConfig with the unified ZamaEthereumConfig.

Update Solidity Code: Remove all calls to the discontinued Oracle-based FHE library functions.

Re-compile & Re-deploy: Due to new FHEVM addresses, all affected contracts must be re-compiled and re-deployed on Sepolia.

Rewrite Public Decryption Logic: Eliminate reliance on the discontinued Zama Oracle and implement the self-relaying workflow using the @zama-fhe/relayer-sdk and FHE.verifySignatures().

Follow these steps for a smooth transition to FHEVM v0.9:

Step 1: Update Core Dependencies

Ensure your project uses the latest versions of the FHEVM development tools.

Dependency
Minimum Required Version
Notes

@fhevm/solidity

v0.9.1

Contains the updated FHE library contracts.

@zama-fhe/relayer-sdk

v0.3.0-5

Crucial for v0.9: Enables the new self-relaying decryption model.

@fhevm/hardhat-plugin

v0.3.0-1

Latest tooling support for development and deployment.

Step 2: Update Network Configuration in Solidity

The Solidity contracts now use a unified configuration contract defined in @fhevm/solidity/config/ZamaConfig.sol.

⚠️ Removal: The SepoliaConfig contract is now removed.

✅ New Standard: Update your imports and usages to use the new standard ZamaEthereumConfig contract. This change simplifies future cross-chain compatibility.

The new ZamaEthereumConfig abstract contract now dynamically resolves the FHEVM host addresses according to the block.chainid.

Replace:

Copy
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

With:

Copy
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

You can read more about Configuration on the dedicated page.

Step 3: Update Solidity Code

The Zama public decryption Oracle is discontinued. The following functions are no more available in the FHE Solidity library:

FHE.loadRequestedHandles

FHE.requestDecryptionWithoutSavingHandles

FHE.requestDecryption

Step 4: Re-compile and Re-deploy Smart Contracts

Due to fundamental changes in the FHEVM implementation and underlying infrastructure:

New FHEVM Addresses: The contract addresses for core FHE components have changed.

Action: You must re-compile your entire Solidity codebase and re-deploy all affected contracts to the Sepolia network.

Step 5: Adjust Public Decryption Logic (Crucial Architectural Change)

The most significant change is the discontinuation of the Zama Oracle. This requires substantial adjustments to how your dApp handles decryption on-chain.

Aspect
FHEVM v0.8 (Old Logic)
FHEVM v0.9 (New Logic)

Decryption Handler

Zama Oracle actively listens for requests and submits the result.

dApp Client/User performs the off-chain decryption (self-relaying).

Solidity Function

Used FHE.requestDecryption().

You will now create custom functions that accept the decrypted value and the proof.

Client-Side Tool

N/A

Use @zama-fhe/relayer-sdk to perform the publicDecrypt and obtain the proof.

Action: Thoroughly review your Solidity code, dApp logic, and backend services. Any code relying on the external Oracle must be rewritten to implement the self-relaying workflow using the @zama-fhe/relayer-sdk.

FHEVM v0.9 Code Examples: Public Decryption Logic

The following code examples illustrate the new public decryption logic introduced in v0.9. This new workflow uses the combination of:

On-chain public decyption permission via FHE.makePubliclyDecryptable

Off-chain decryption via publicDecrypt using the @zama-fhe/relayer-sdk or the FHEVM Hardhat Plugin

On-chain signature verification via FHE.checkSignatures

Code Examples

HeadsOrTails: Demonstrates the complete public decryption workflow where a cipher text is first marked as decryptable on-chain via FHE.makePubliclyDecryptable, and its cleartext value is subsequently verified on-chain using FHE.checkSignatures after being fetched off-chain via publicDecrypt.

HighestDieRoll: Extends the public decryption workflow to a multi-input scenario, demonstrating how the on-chain FHE.checkSignatures function ensures the authenticity of multiple cleartext values derived from multiple encrypted on-chain cypher texts.

Previous
HCU
Next
How to Transform Your Smart Contract into a FHEVM Smart Contract?

Last updated 10 days ago

---

## 39. How to Transform Your Smart Contract into a FHEVM Smart Contract? | Solidity Guides | Protocol

_Source: https://docs.zama.org/protocol/solidity-guides/development-guide/transform_smart_contract_with_fhevm_

Copy
DEVELOPMENT GUIDE
How to Transform Your Smart Contract into a FHEVM Smart Contract?

This short guide will walk you through converting a standard Solidity contract into one that leverages Fully Homomorphic Encryption (FHE) using FHEVM. This approach lets you develop your contract logic as usual, then adapt it to support encrypted computation for privacy.

For this guide, we will focus on a voting contract example.

1. Start with a Standard Solidity Contract

Begin by writing your voting contract in Solidity as you normally would. Focus on implementing the core logic and functionality.

Copy
// Standard Solidity voting contract example

pragma solidity ^0.8.0;



contract SimpleVoting {

    mapping(address => bool) public hasVoted;

    uint64 public yesVotes;

    uint64 public noVotes;

    uint256 public voteDeadline;



    function vote(bool support) public {

        require(block.timestamp <= voteDeadline, "Too late to vote");

        require(!hasVoted[msg.sender], "Already voted");

        hasVoted[msg.sender] = true;



        if (support) {

            yesVotes += 1;

        } else {

            noVotes += 1;

        }

    }



    function getResults() public view returns (uint64, uint64) {

        return (yesVotes, noVotes);

    }

}
2. Identify Sensitive Data and Operations

Review your contract and determine which variables, functions, or computations require privacy. In this example, the vote counts (yesVotes, noVotes) and individual votes should be encrypted.

3. Integrate FHEVM and update your business logic accordingly.

Replace standard data types and operations with their FHEVM equivalents for the identified sensitive parts. Use encrypted types and FHEVM library functions to perform computations on encrypted data.

Copy
pragma solidity ^0.8.0;



import "@fhevm/solidity/lib/FHE.sol";

import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";



contract EncryptedSimpleVoting is ZamaEthereumConfig {

    enum VotingStatus {

        Open,

        DecryptionInProgress,

        ResultsDecrypted

    }

    mapping(address => bool) public hasVoted;



    VotingStatus public status;



    uint64 public decryptedYesVotes;

    uint64 public decryptedNoVotes;



    uint256 public voteDeadline;



    euint64 private encryptedYesVotes;

    euint64 private encryptedNoVotes;



    constructor() {

        encryptedYesVotes = FHE.asEuint64(0);

        encryptedNoVotes = FHE.asEuint64(0);



        FHE.allowThis(encryptedYesVotes);

        FHE.allowThis(encryptedNoVotes);

    }



    function vote(externalEbool support, bytes memory inputProof) public {

        require(block.timestamp <= voteDeadline, "Too late to vote");

        require(!hasVoted[msg.sender], "Already voted");

        hasVoted[msg.sender] = true;

        ebool isSupport = FHE.fromExternal(support, inputProof);

        encryptedYesVotes = FHE.select(isSupport, FHE.add(encryptedYesVotes, 1), encryptedYesVotes);

        encryptedNoVotes = FHE.select(isSupport, encryptedNoVotes, FHE.add(encryptedNoVotes, 1));

        FHE.allowThis(encryptedYesVotes);

        FHE.allowThis(encryptedNoVotes);

        

    }



    function requestVoteDecryption() public {

        require(block.timestamp > voteDeadline, "Voting is not finished");

        bytes32[] memory cts = new bytes32[](2);

        cts[0] = FHE.toBytes32(encryptedYesVotes);

        cts[1] = FHE.toBytes32(encryptedNoVotes);

        uint256 requestId = FHE.requestDecryption(cts, this.callbackDecryptVotes.selector);

        status = VotingStatus.DecryptionInProgress;

    }



    function callbackDecryptVotes(uint256 requestId, bytes memory cleartexts, bytes memory decryptionProof) public {

        FHE.checkSignatures(requestId, cleartexts, decryptionProof);



        (uint64 yesVotes, uint64 noVotes) = abi.decode(cleartexts, (uint64, uint64));

        decryptedYesVotes = yesVotes;

        decryptedNoVotes = noVotes;

        status = VotingStatus.ResultsDecrypted;

    }



    function getResults() public view returns (uint64, uint64) {

        require(status == VotingStatus.ResultsDecrypted, "Results were not decrypted");

        return (

            decryptedYesVotes,

            decryptedNoVotes

        );

    }

}

Adjust your contract’s code to accept and return encrypted data where necessary. This may involve changing function parameters and return types to work with ciphertexts instead of plaintext values, as shown above.

The vote function now has two parameters: support and inputProof.

The getResults can only be called after the decryption occurred. Otherwise, the decrypted results are not visible to anyone.

However, it is far from being the main change. As this example illustrates, working with FHEVM often requires re-architecting the original logic to support privacy.

In the updated code, the logic becomes async; results are hidden until a request (to the oracle) explicitely has to be made to decrypt publically the vote results.

Conclusion

As this short guide showed, integrating with FHEVM not only requires integration with the FHEVM stack, it also requires refactoring your business logic to support mechanism to swift between encrypted and non-encrypted components of the logic.

Previous
Migrate to v0.9

Last updated 5 days ago

---

## 40. Overview | Relayer SDK Guides | Protocol

_Source: https://docs.zama.org/protocol/relayer-sdk-guides_

Copy
Overview

Welcome to the Relayer SDK Docs.

This section provides an overview of the key features of Zama’s FHEVM Relayer JavaScript SDK. The SDK lets you interact with FHEVM smart contracts without dealing directly with the Gateway Chain.

With the Relayer, FHEVM clients only need a wallet on the FHEVM host chain. All interactions with the Gateway chain are handled through HTTP calls to Zama's Relayer, which pays for it on the Gateway chain.

Where to go next

If you’re new to the Zama Protocol, start with the Litepaper or the Protocol Overview to understand the foundations.

Otherwise:

🟨 Go to Setup guide to learn how to configure the Relayer SDK for your project.

🟨 Go to Input registration to see how to register new encrypted inputs for your smart contracts.

🟨 Go to User decryption to enable users to decrypt data with their own keys, once permissions have been granted via Access Control List(ACL).

🟨 Go to Public decryption to learn how to decrypt outputs that are publicly accessible, either via HTTP or onchain Oracle.

🟨 Go to Solidity ACL Guide for more detailed instructions about access control.

Help center

Ask technical questions and discuss with the community.

Community forum

Discord channel

Next
Initialization

Last updated 2 months ago

---

## 41. Initialization | Relayer SDK Guides | Protocol

_Source: https://docs.zama.org/protocol/relayer-sdk-guides/fhevm-relayer/initialization_

Copy
FHEVM RELAYER
Initialization

The use of @zama-fhe/relayer-sdk requires a setup phase. This consists of the instantiation of the FhevmInstance. This object holds all the configuration and methods needed to interact with an FHEVM using a Relayer. It can be created using the following code snippet:

Copy
import { createInstance } from '@zama-fhe/relayer-sdk';



const instance = await createInstance({

  // ACL_CONTRACT_ADDRESS (FHEVM Host chain)

  aclContractAddress: '0x687820221192C5B662b25367F70076A37bc79b6c',

  // KMS_VERIFIER_CONTRACT_ADDRESS (FHEVM Host chain)

  kmsContractAddress: '0x1364cBBf2cDF5032C47d8226a6f6FBD2AFCDacAC',

  // INPUT_VERIFIER_CONTRACT_ADDRESS (FHEVM Host chain)

  inputVerifierContractAddress: '0xbc91f3daD1A5F19F8390c400196e58073B6a0BC4',

  // DECRYPTION_ADDRESS (Gateway chain)

  verifyingContractAddressDecryption:

    '0xb6E160B1ff80D67Bfe90A85eE06Ce0A2613607D1',

  // INPUT_VERIFICATION_ADDRESS (Gateway chain)

  verifyingContractAddressInputVerification:

    '0x7048C39f048125eDa9d678AEbaDfB22F7900a29F',

  // FHEVM Host chain id

  chainId: 11155111,

  // Gateway chain id

  gatewayChainId: 55815,

  // Optional RPC provider to host chain

  network: 'https://eth-sepolia.public.blastapi.io',

  // Relayer URL

  relayerUrl: 'https://relayer.testnet.zama.cloud',

});

or the even simpler:

Copy
import { createInstance, SepoliaConfig } from '@zama-fhe/relayer-sdk';



const instance = await createInstance(SepoliaConfig);

The information regarding the configuration of Sepolia's FHEVM and associated Relayer maintained by Zama can be found in the SepoliaConfig object or in the contract addresses page. The gatewayChainId is 55815. The chainId is the chain-id of the FHEVM chain, so for Sepolia it would be 11155111.

For more information on the Relayer's part in the overall architecture please refer to the Relayer's page in the architecture documentation.

Previous
Overview
Next
Input

Last updated 2 months ago

---

## 42. Input | Relayer SDK Guides | Protocol

_Source: https://docs.zama.org/protocol/relayer-sdk-guides/fhevm-relayer/input_

Copy
FHEVM RELAYER
Input

This document explains how to register ciphertexts to the FHEVM. Registering ciphertexts to the FHEVM allows for future use on-chain using the FHE.fromExternal solidity function. All values encrypted for use with the FHEVM are encrypted under a public key of the protocol.

Copy
// We first create a buffer for values to encrypt and register to the fhevm

const buffer = instance.createEncryptedInput(

  // The address of the contract allowed to interact with the "fresh" ciphertexts

  contractAddress,

  // The address of the entity allowed to import ciphertexts to the contract at `contractAddress`

  userAddress,

);



// We add the values with associated data-type method

buffer.add64(BigInt(23393893233));

buffer.add64(BigInt(1));

// buffer.addBool(false);

// buffer.add8(BigInt(43));

// buffer.add16(BigInt(87));

// buffer.add32(BigInt(2339389323));

// buffer.add128(BigInt(233938932390));

// buffer.addAddress('0xa5e1defb98EFe38EBb2D958CEe052410247F4c80');

// buffer.add256(BigInt('2339389323922393930'));



// This will encrypt the values, generate a proof of knowledge for it, and then upload the ciphertexts using the relayer.

// This action will return the list of ciphertext handles.

const ciphertexts = await buffer.encrypt();

With a contract MyContract that implements the following it is possible to add two "fresh" ciphertexts.

Copy
contract MyContract {

  ...



  function add(

    externalEuint64 a,

    externalEuint64 b,

    bytes calldata proof

  ) public virtual returns (euint64) {

    return FHE.add(FHE.fromExternal(a, proof), FHE.fromExternal(b, proof))

  }

}

With my_contract the contract in question using ethers it is possible to call the add function as following.

Copy
my_contract.add(

  ciphertexts.handles[0],

  ciphertexts.handles[1],

  ciphertexts.inputProof,

);
Previous
Initialization
Next
Decryption

Last updated 2 months ago

---

## 43. User decryption | Relayer SDK Guides | Protocol

_Source: https://docs.zama.org/protocol/relayer-sdk-guides/fhevm-relayer/decryption/user-decryption_

Copy
FHEVM RELAYER
DECRYPTION
User decryption

This document explains how to perform user decryption. User decryption is required when you want a user to access their private data without it being exposed to the blockchain.

User decryption in FHEVM enables the secure sharing or reuse of encrypted data under a new public key without exposing the plaintext.

This feature is essential for scenarios where encrypted data must be transferred between contracts, dApps, or users while maintaining its confidentiality.

When to use user decryption

User decryption is particularly useful for allowing individual users to securely access and decrypt their private data, such as balances or counters, while maintaining data confidentiality.

Overview

The user decryption process involves retrieving ciphertext from the blockchain and performing user-decryption on the client-side. In other words we take the data that has been encrypted by the KMS, decrypt it and encrypt it with the user's private key, so only he can access the information.

This ensures that the data remains encrypted under the blockchain’s FHE key but can be securely shared with a user by re-encrypting it under the user’s NaCl public key.

User decryption is facilitated by the Relayer and the Key Management System (KMS). The workflow consists of the following:

Retrieving the ciphertext from the blockchain using a contract’s view function.

Re-encrypting the ciphertext client-side with the user’s public key, ensuring only the user can decrypt it.

Step 1: retrieve the ciphertext

To retrieve the ciphertext that needs to be decrypted, you can implement a view function in your smart contract. Below is an example implementation:

Copy
import "@fhevm/solidity/lib/FHE.sol";



contract ConfidentialERC20 {

  ...

  function balanceOf(account address) public view returns (euint64) {

    return balances[msg.sender];

  }

  ...

}

Here, balanceOf allows retrieval of the user’s encrypted balance handle stored on the blockchain. Doing this will return the ciphertext handle, an identifier for the underlying ciphertext.

For the user to be able to user decrypt (also called re-encrypt) the ciphertext value the access control (ACL) needs to be set properly using the FHE.allow(ciphertext, address) function in the solidity contract holding the ciphertext.

For more details on the topic please refer to the ACL documentation.

Step 2: decrypt the ciphertext

Using that ciphertext handle user decryption is performed client-side using the @zama-fhe/relayer-sdk library. The user needs to have created an instance object prior to that (for more context see the relayer-sdk setup page).

Copy
// instance: [`FhevmInstance`] from `zama-fhe/relayer-sdk`

// signer: [`Signer`] from ethers (could a [`Wallet`])

// ciphertextHandle: [`string`]

// contractAddress: [`string`]



const keypair = instance.generateKeypair();

const handleContractPairs = [

  {

    handle: ciphertextHandle,

    contractAddress: contractAddress,

  },

];

const startTimeStamp = Math.floor(Date.now() / 1000).toString();

const durationDays = '10'; // String for consistency

const contractAddresses = [contractAddress];



const eip712 = instance.createEIP712(

  keypair.publicKey,

  contractAddresses,

  startTimeStamp,

  durationDays,

);



const signature = await signer.signTypedData(

  eip712.domain,

  {

    UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification,

  },

  eip712.message,

);



const result = await instance.userDecrypt(

  handleContractPairs,

  keypair.privateKey,

  keypair.publicKey,

  signature.replace('0x', ''),

  contractAddresses,

  signer.address,

  startTimeStamp,

  durationDays,

);



const decryptedValue = result[ciphertextHandle];
Previous
Decryption
Next
Public decryption

Last updated 2 months ago

---

## 44. Public decryption | Relayer SDK Guides | Protocol

_Source: https://docs.zama.org/protocol/relayer-sdk-guides/fhevm-relayer/decryption/public-decryption_

Copy
FHEVM RELAYER
DECRYPTION
Public decryption

This document explains how to perform public decryption of FHEVM ciphertexts. Public decryption is required when you want everyone to see the value in a ciphertext, for example the result of private auction. Public decryption can be done with either the Relayer HTTP endpoint or calling the on-chain decryption oracle.

HTTP Public Decrypt

Calling the public decryption endpoint of the Relayer can be done easily using the following code snippet.

Copy
// A list of ciphertexts handles to decrypt

const handles = [

  '0x830a61b343d2f3de67ec59cb18961fd086085c1c73ff0000000000aa36a70000',

  '0x98ee526413903d4613feedb9c8fa44fe3f4ed0dd00ff0000000000aa36a70400',

  '0xb837a645c9672e7588d49c5c43f4759a63447ea581ff0000000000aa36a70700',

];



// The list of decrypted values

// {

//  '0x830a61b343d2f3de67ec59cb18961fd086085c1c73ff0000000000aa36a70000': true,

//  '0x98ee526413903d4613feedb9c8fa44fe3f4ed0dd00ff0000000000aa36a70400': 242n,

//  '0xb837a645c9672e7588d49c5c43f4759a63447ea581ff0000000000aa36a70700': '0xfC4382C084fCA3f4fB07c3BCDA906C01797595a8'

// }

const values = instance.publicDecrypt(handles);
Onchain Public Decrypt

For more details please refer to the on onchain Oracle public decryption page.

Previous
User decryption
Next
Web applications

Last updated 2 months ago

---

## 45. Web applications | Relayer SDK Guides | Protocol

_Source: https://docs.zama.org/protocol/relayer-sdk-guides/development-guide/webapp_

Copy
DEVELOPMENT GUIDE
Web applications

This document guides you through building a web application using the @zama-fhe/relayer-sdk library.

Using directly the library
Step 1: Setup the library

@zama-fhe/relayer-sdk consists of multiple files, including WASM files and WebWorkers, which can make packaging these components correctly in your setup cumbersome. To simplify this process, especially if you're developing a dApp with server-side rendering (SSR), we recommend using our CDN.

Using UMD CDN

Include this line at the top of your project.

Copy
<script

  src="https://cdn.zama.ai/relayer-sdk-js/0.2.0/relayer-sdk-js.umd.cjs"

  type="text/javascript"

></script>

In your project, you can use the bundle import if you install @zama-fhe/relayer-sdk package:

Copy
import {

  initSDK,

  createInstance,

  SepoliaConfig,

} from '@zama-fhe/relayer-sdk/bundle';
Using ESM CDN

If you prefer You can also use the @zama-fhe/relayer-sdk as a ES module:

Copy
<script type="module">

  import {

    initSDK,

    createInstance,

    SepoliaConfig,

  } from 'https://cdn.zama.ai/relayer-sdk-js/0.2.0/relayer-sdk-js.js';



  await initSDK();

  const config = { ...SepoliaConfig, network: window.ethereum };

  config.network = window.ethereum;

  const instance = await createInstance(config);

</script>
Using npm package

Install the @zama-fhe/relayer-sdk library to your project:

Copy
# Using npm

npm install @zama-fhe/relayer-sdk



# Using Yarn

yarn add @zama-fhe/relayer-sdk



# Using pnpm

pnpm add @zama-fhe/relayer-sdk

@zama-fhe/relayer-sdk uses ESM format. You need to set the type to "module" in your package.json. If your node project use "type": "commonjs" or no type, you can force the loading of the web version by using import { createInstance } from '@zama-fhe/relayer-sdk/web';

Copy
import { initSDK, createInstance, SepoliaConfig } from '@zama-fhe/relayer-sdk';
Step 2: Initialize your project

To use the library in your project, you need to load the WASM of TFHE first with initSDK.

Copy
import { initSDK } from '@zama-fhe/relayer-sdk/bundle';



const init = async () => {

  await initSDK(); // Load needed WASM

};
Step 3: Create an instance

Once the WASM is loaded, you can now create an instance.

Copy
import {

  initSDK,

  createInstance,

  SepoliaConfig,

} from '@zama-fhe/relayer-sdk/bundle';



const init = async () => {

  await initSDK(); // Load FHE

  const config = { ...SepoliaConfig, network: window.ethereum };

  return createInstance(config);

};



init().then((instance) => {

  console.log(instance);

});

You can now use your instance to encrypt parameters, perform user decryptions or public decryptions.

Previous
Public decryption
Next
Debugging

Last updated 2 months ago

---

## 46. Debugging | Relayer SDK Guides | Protocol

_Source: https://docs.zama.org/protocol/relayer-sdk-guides/development-guide/webpack_

Copy
DEVELOPMENT GUIDE
Debugging

This document provides solutions for common Webpack errors encountered during the development process. Follow the steps below to resolve each issue.

Can't resolve 'tfhe_bg.wasm'

Error message: Module not found: Error: Can't resolve 'tfhe_bg.wasm'

Cause: In the codebase, there is a new URL('tfhe_bg.wasm') which triggers a resolve by Webpack.

Possible solutions: You can add a fallback for this file by adding a resolve configuration in your webpack.config.js:

Copy
resolve: {

  fallback: {

    'tfhe_bg.wasm': require.resolve('tfhe/tfhe_bg.wasm'),

  },

},
Buffer not defined

Error message: ReferenceError: Buffer is not defined

Cause: This error occurs when the Node.js Buffer object is used in a browser environment where it is not natively available.

Possible solutions: To resolve this issue, you need to provide browser-compatible fallbacks for Node.js core modules. Install the necessary browserified npm packages and configure Webpack to use these fallbacks.

Copy
resolve: {

  fallback: {

    buffer: require.resolve('buffer/'),

    crypto: require.resolve('crypto-browserify'),

    stream: require.resolve('stream-browserify'),

    path: require.resolve('path-browserify'),

  },

},
Issue with importing ESM version

Error message: Issues with importing ESM version

Cause: With a bundler such as Webpack or Rollup, imports will be replaced with the version mentioned in the "browser" field of the package.json. This can cause issues with typing.

Possible solutions:

If you encounter issues with typing, you can use this tsconfig.json using TypeScript 5.

If you encounter any other issue, you can force import of the browser package.

Use bundled version

Error message: Issues with bundling the library, especially with SSR frameworks.

Cause: The library may not bundle correctly with certain frameworks, leading to errors during the build or runtime process.

Possible solutions: Use the prebundled version available with @zama-fhe/relayer-sdk/bundle. Embed the library with a <script> tag and initialize it as shown below:

Copy
const start = async () => {

  await window.fhevm.initSDK(); // load wasm needed

  const config = { ...SepoliaConfig, network: window.ethereum };

  config.network = window.ethereum;

  const instance = window.fhevm.createInstance(config).then((instance) => {

    console.log(instance);

  });

};
Previous
Web applications
Next
CLI

Last updated 2 months ago

---

## 47. CLI | Relayer SDK Guides | Protocol

_Source: https://docs.zama.org/protocol/relayer-sdk-guides/development-guide/cli_

Copy
DEVELOPMENT GUIDE
CLI

The fhevm Command-Line Interface (CLI) tool provides a simple and efficient way to encrypt data for use with the blockchain's Fully Homomorphic Encryption (FHE) system. This guide explains how to install and use the CLI to encrypt integers and booleans for confidential smart contracts.

Installation

Ensure you have Node.js installed on your system before proceeding. Then, globally install the @zama-fhe/relayer-sdk package to enable the CLI tool:

Copy
npm install -g @zama-fhe/relayer-sdk

Once installed, you can access the CLI using the relayer command. Verify the installation and explore available commands using:

Copy
relayer help
Encrypting Data

The CLI allows you to encrypt integers and booleans for use in smart contracts. Encryption is performed using the blockchain's FHE public key, ensuring the confidentiality of your data.

Syntax
Copy
relayer encrypt --node <NODE_URL> <CONTRACT_ADDRESS> <USER_ADDRESS> <DATA:TYPE>...

--node: Specifies the RPC URL of the blockchain node (e.g., http://localhost:8545).

<CONTRACT_ADDRESS>: The address of the contract interacting with the encrypted data.

<USER_ADDRESS>: The address of the user associated with the encrypted data.

<DATA:TYPE>: The data to encrypt, followed by its type:

:64 for 64-bit integers

:1 for booleans

Example Usage

Encrypt the integer 71721075 (64-bit) and the boolean 1 for the contract at 0x8Fdb26641d14a80FCCBE87BF455338Dd9C539a50 and the user at 0xa5e1defb98EFe38EBb2D958CEe052410247F4c80:

Copy
relayer encrypt 0x8Fdb26641d14a80FCCBE87BF455338Dd9C539a50 0xa5e1defb98EFe38EBb2D958CEe052410247F4c80 71721075:64 1:1
Previous
Debugging

Last updated 2 months ago

---

## 48. FHE counter | Examples | Protocol

_Source: https://docs.zama.org/protocol/examples_

Copy
BASIC
FHE counter

This example demonstrates how to build an confidential counter using FHEVM, in comparison to a simple counter.

To run this example correctly, make sure the files are placed in the following directories:

.sol file → <your-project-root-dir>/contracts/

.ts file → <your-project-root-dir>/test/

This ensures Hardhat can compile and test your contracts as expected.

A simple counter
counter.sol
counter.ts
Copy
// SPDX-License-Identifier: BSD-3-Clause-Clear

pragma solidity ^0.8.24;



/// @title A simple counter contract

contract Counter {

  uint32 private _count;



  /// @notice Returns the current count

  function getCount() external view returns (uint32) {

    return _count;

  }



  /// @notice Increments the counter by a specific value

  function increment(uint32 value) external {

    _count += value;

  }



  /// @notice Decrements the counter by a specific value

  function decrement(uint32 value) external {

    require(_count >= value, "Counter: cannot decrement below zero");

    _count -= value;

  }

}
An FHE counter
FHECounter.sol
FHECounter.ts
Copy
// SPDX-License-Identifier: BSD-3-Clause-Clear

pragma solidity ^0.8.24;



import { FHE, euint32, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";

import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";



/// @title A simple FHE counter contract

contract FHECounter is ZamaEthereumConfig {

  euint32 private _count;



  /// @notice Returns the current count

  function getCount() external view returns (euint32) {

    return _count;

  }



  /// @notice Increments the counter by a specified encrypted value.

  /// @dev This example omits overflow/underflow checks for simplicity and readability.

  /// In a production contract, proper range checks should be implemented.

  function increment(externalEuint32 inputEuint32, bytes calldata inputProof) external {

    euint32 encryptedEuint32 = FHE.fromExternal(inputEuint32, inputProof);



    _count = FHE.add(_count, encryptedEuint32);



    FHE.allowThis(_count);

    FHE.allow(_count, msg.sender);

  }



  /// @notice Decrements the counter by a specified encrypted value.

  /// @dev This example omits overflow/underflow checks for simplicity and readability.

  /// In a production contract, proper range checks should be implemented.

  function decrement(externalEuint32 inputEuint32, bytes calldata inputProof) external {

    euint32 encryptedEuint32 = FHE.fromExternal(inputEuint32, inputProof);



    _count = FHE.sub(_count, encryptedEuint32);



    FHE.allowThis(_count);

    FHE.allow(_count, msg.sender);

  }

}
Next
FHE Operations

Last updated 9 days ago

---

## 49. Add | Examples | Protocol

_Source: https://docs.zama.org/protocol/examples/basic/fhe-operations/fheadd_

Copy
BASIC
FHE OPERATIONS
Add

This example demonstrates how to write a simple "a + b" contract using FHEVM.

To run this example correctly, make sure the files are placed in the following directories:

.sol file → <your-project-root-dir>/contracts/

.ts file → <your-project-root-dir>/test/

This ensures Hardhat can compile and test your contracts as expected.

FHEAdd.sol
FHEAdd.ts
Copy
// SPDX-License-Identifier: BSD-3-Clause-Clear

pragma solidity ^0.8.24;



import { FHE, euint8, externalEuint8 } from "@fhevm/solidity/lib/FHE.sol";

import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";



contract FHEAdd is ZamaEthereumConfig {

  euint8 private _a;

  euint8 private _b;

  // solhint-disable-next-line var-name-mixedcase

  euint8 private _a_plus_b;



  // solhint-disable-next-line no-empty-blocks

  constructor() {}



  function setA(externalEuint8 inputA, bytes calldata inputProof) external {

    _a = FHE.fromExternal(inputA, inputProof);

    FHE.allowThis(_a);

  }



  function setB(externalEuint8 inputB, bytes calldata inputProof) external {

    _b = FHE.fromExternal(inputB, inputProof);

    FHE.allowThis(_b);

  }



  function computeAPlusB() external {

    // The sum `a + b` is computed by the contract itself (`address(this)`).

    // Since the contract has FHE permissions over both `a` and `b`,

    // it is authorized to perform the `FHE.add` operation on these values.

    // It does not matter if the contract caller (`msg.sender`) has FHE permission or not.

    _a_plus_b = FHE.add(_a, _b);



    // At this point the contract ifself (`address(this)`) has been granted ephemeral FHE permission

    // over `_a_plus_b`. This FHE permission will be revoked when the function exits.

    //

    // Now, to make sure `_a_plus_b` can be decrypted by the contract caller (`msg.sender`),

    // we need to grant permanent FHE permissions to both the contract ifself (`address(this)`)

    // and the contract caller (`msg.sender`)

    FHE.allowThis(_a_plus_b);

    FHE.allow(_a_plus_b, msg.sender);

  }



  function result() public view returns (euint8) {

    return _a_plus_b;

  }

}
Previous
FHE Operations
Next
If then else

Last updated 9 days ago

---

## 50. If then else | Examples | Protocol

_Source: https://docs.zama.org/protocol/examples/basic/fhe-operations/fheifthenelse_

Copy
BASIC
FHE OPERATIONS
If then else

This example demonstrates how to write a simple contract with conditions using FHEVM, in comparison to a simple counter.

To run this example correctly, make sure the files are placed in the following directories:

.sol file → <your-project-root-dir>/contracts/

.ts file → <your-project-root-dir>/test/

This ensures Hardhat can compile and test your contracts as expected.

FHEIfThenElse.sol
FHEIfThenElse.ts
Copy
// SPDX-License-Identifier: BSD-3-Clause-Clear

pragma solidity ^0.8.24;



import { FHE, ebool, euint8, externalEuint8 } from "@fhevm/solidity/lib/FHE.sol";

import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";



contract FHEIfThenElse is ZamaEthereumConfig {

  euint8 private _a;

  euint8 private _b;

  euint8 private _max;



  // solhint-disable-next-line no-empty-blocks

  constructor() {}



  function setA(externalEuint8 inputA, bytes calldata inputProof) external {

    _a = FHE.fromExternal(inputA, inputProof);

    FHE.allowThis(_a);

  }



  function setB(externalEuint8 inputB, bytes calldata inputProof) external {

    _b = FHE.fromExternal(inputB, inputProof);

    FHE.allowThis(_b);

  }



  function computeMax() external {

    // a >= b

    // solhint-disable-next-line var-name-mixedcase

    ebool _a_ge_b = FHE.ge(_a, _b);



    // a >= b ? a : b

    _max = FHE.select(_a_ge_b, _a, _b);



    // For more information about FHE permissions in this case,

    // read the `computeAPlusB()` commentaries in `FHEAdd.sol`.

    FHE.allowThis(_max);

    FHE.allow(_max, msg.sender);

  }



  function result() public view returns (euint8) {

    return _max;

  }

}
Previous
Add
Next
Encryption

Last updated 9 days ago

---

## 51. Encrypt single value | Examples | Protocol

_Source: https://docs.zama.org/protocol/examples/basic/encryption/fhe-encrypt-single-value_

Copy
BASIC
ENCRYPTION
Encrypt single value

This example demonstrates the FHE encryption mechanism and highlights a common pitfall developers may encounter.

To run this example correctly, make sure the files are placed in the following directories:

.sol file → <your-project-root-dir>/contracts/

.ts file → <your-project-root-dir>/test/

This ensures Hardhat can compile and test your contracts as expected.

EncryptSingleValue.sol
EncryptSingleValue.ts
Copy
// SPDX-License-Identifier: BSD-3-Clause-Clear

pragma solidity ^0.8.24;



import { FHE, externalEuint32, euint32 } from "@fhevm/solidity/lib/FHE.sol";

import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";



/**

 * This trivial example demonstrates the FHE encryption mechanism.

 */

contract EncryptSingleValue is ZamaEthereumConfig {

  euint32 private _encryptedEuint32;



  // solhint-disable-next-line no-empty-blocks

  constructor() {}



  function initialize(externalEuint32 inputEuint32, bytes calldata inputProof) external {

    _encryptedEuint32 = FHE.fromExternal(inputEuint32, inputProof);



    // Grant FHE permission to both the contract itself (`address(this)`) and the caller (`msg.sender`),

    // to allow future decryption by the caller (`msg.sender`).

    FHE.allowThis(_encryptedEuint32);

    FHE.allow(_encryptedEuint32, msg.sender);

  }



  function encryptedUint32() public view returns (euint32) {

    return _encryptedEuint32;

  }

}
Previous
Encryption
Next
Encrypt multiple values

Last updated 9 days ago

---

## 52. Encrypt multiple values | Examples | Protocol

_Source: https://docs.zama.org/protocol/examples/basic/encryption/fhe-encrypt-multiple-values_

Copy
BASIC
ENCRYPTION
Encrypt multiple values

This example demonstrates the FHE encryption mechanism with multiple values.

To run this example correctly, make sure the files are placed in the following directories:

.sol file → <your-project-root-dir>/contracts/

.ts file → <your-project-root-dir>/test/

This ensures Hardhat can compile and test your contracts as expected.

EncryptMultipleValues.sol
EncryptMultipleValues.ts
Copy
// SPDX-License-Identifier: BSD-3-Clause-Clear

pragma solidity ^0.8.24;



import {

  FHE,

  externalEbool,

  externalEuint32,

  externalEaddress,

  ebool,

  euint32,

  eaddress

} from "@fhevm/solidity/lib/FHE.sol";

import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";



/**

 * This trivial example demonstrates the FHE encryption mechanism.

 */

contract EncryptMultipleValues is ZamaEthereumConfig {

  ebool private _encryptedEbool;

  euint32 private _encryptedEuint32;

  eaddress private _encryptedEaddress;



  // solhint-disable-next-line no-empty-blocks

  constructor() {}



  function initialize(

    externalEbool inputEbool,

    externalEuint32 inputEuint32,

    externalEaddress inputEaddress,

    bytes calldata inputProof

  ) external {

    _encryptedEbool = FHE.fromExternal(inputEbool, inputProof);

    _encryptedEuint32 = FHE.fromExternal(inputEuint32, inputProof);

    _encryptedEaddress = FHE.fromExternal(inputEaddress, inputProof);



    // For each of the 3 values:

    // Grant FHE permission to both the contract itself (`address(this)`) and the caller (`msg.sender`),

    // to allow future decryption by the caller (`msg.sender`).



    FHE.allowThis(_encryptedEbool);

    FHE.allow(_encryptedEbool, msg.sender);



    FHE.allowThis(_encryptedEuint32);

    FHE.allow(_encryptedEuint32, msg.sender);



    FHE.allowThis(_encryptedEaddress);

    FHE.allow(_encryptedEaddress, msg.sender);

  }



  function encryptedBool() public view returns (ebool) {

    return _encryptedEbool;

  }



  function encryptedUint32() public view returns (euint32) {

    return _encryptedEuint32;

  }



  function encryptedAddress() public view returns (eaddress) {

    return _encryptedEaddress;

  }

}
Previous
Encrypt single value
Next
Decryption

Last updated 9 days ago

---

## 53. User decrypt single value | Examples | Protocol

_Source: https://docs.zama.org/protocol/examples/basic/decryption/fhe-user-decrypt-single-value_

Copy
BASIC
DECRYPTION
User decrypt single value

This example demonstrates the FHE user decryption mechanism with a single value.

User decryption is a mechanism that allows specific users to decrypt encrypted values while keeping them hidden from others. Unlike public decryption where decrypted values become visible to everyone, user decryption maintains privacy by only allowing authorized users with the proper permissions to view the data. While permissions are granted onchain through smart contracts, the actual decryption call occurs off-chain in the frontend application.

To run this example correctly, make sure the files are placed in the following directories:

.sol file → <your-project-root-dir>/contracts/

.ts file → <your-project-root-dir>/test/

This ensures Hardhat can compile and test your contracts as expected.

UserDecryptSingleValue.sol
UserDecryptSingleValue.ts
Copy
// SPDX-License-Identifier: BSD-3-Clause-Clear

pragma solidity ^0.8.24;



import { FHE, euint32 } from "@fhevm/solidity/lib/FHE.sol";

import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";



/**

 * This trivial example demonstrates the FHE decryption mechanism

 * and highlights common pitfalls developers may encounter.

 */

contract UserDecryptSingleValue is ZamaEthereumConfig {

  euint32 private _trivialEuint32;



  // solhint-disable-next-line no-empty-blocks

  constructor() {}



  function initializeUint32(uint32 value) external {

    // Compute a trivial FHE formula _trivialEuint32 = value + 1

    _trivialEuint32 = FHE.add(FHE.asEuint32(value), FHE.asEuint32(1));



    // Grant FHE permissions to:

    // ✅ The contract caller (`msg.sender`): allows them to decrypt `_trivialEuint32`.

    // ✅ The contract itself (`address(this)`): allows it to operate on `_trivialEuint32` and

    //    also enables the caller to perform user decryption.

    //

    // Note: If you forget to call `FHE.allowThis(_trivialEuint32)`, the user will NOT be able

    //       to user decrypt the value! Both the contract and the caller must have FHE permissions

    //       for user decryption to succeed.

    FHE.allowThis(_trivialEuint32);

    FHE.allow(_trivialEuint32, msg.sender);

  }



  function initializeUint32Wrong(uint32 value) external {

    // Compute a trivial FHE formula _trivialEuint32 = value + 1

    _trivialEuint32 = FHE.add(FHE.asEuint32(value), FHE.asEuint32(1));



    // ❌ Common FHE permission mistake:

    // ================================================================

    // We grant FHE permissions to the contract caller (`msg.sender`),

    // expecting they will be able to user decrypt the encrypted value later.

    //

    // However, this will fail! 💥

    // The contract itself (`address(this)`) also needs FHE permissions to allow user decryption.

    // Without granting the contract access using `FHE.allowThis(...)`,

    // the user decryption attempt by the user will not succeed.

    FHE.allow(_trivialEuint32, msg.sender);

  }



  function encryptedUint32() public view returns (euint32) {

    return _trivialEuint32;

  }

}
Previous
Decryption
Next
User decrypt multiple values

Last updated 9 days ago

---

## 54. User decrypt multiple values | Examples | Protocol

_Source: https://docs.zama.org/protocol/examples/basic/decryption/fhe-user-decrypt-multiple-values_

Copy
BASIC
DECRYPTION
User decrypt multiple values

This example demonstrates the FHE user decryption mechanism with multiple values.

User decryption is a mechanism that allows specific users to decrypt encrypted values while keeping them hidden from others. Unlike public decryption where decrypted values become visible to everyone, user decryption maintains privacy by only allowing authorized users with the proper permissions to view the data. While permissions are granted onchain through smart contracts, the actual decryption call occurs off-chain in the frontend application.

To run this example correctly, make sure the files are placed in the following directories:

.sol file → <your-project-root-dir>/contracts/

.ts file → <your-project-root-dir>/test/

This ensures Hardhat can compile and test your contracts as expected.

UserDecryptMultipleValues.sol
UserDecryptMultipleValues.ts
Copy
// SPDX-License-Identifier: BSD-3-Clause-Clear

pragma solidity ^0.8.24;



import { FHE, ebool, euint32, euint64 } from "@fhevm/solidity/lib/FHE.sol";

import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";



contract UserDecryptMultipleValues is ZamaEthereumConfig {

  ebool private _encryptedBool; // = 0 (uninitizalized)

  euint32 private _encryptedUint32; // = 0 (uninitizalized)

  euint64 private _encryptedUint64; // = 0 (uninitizalized)



  // solhint-disable-next-line no-empty-blocks

  constructor() {}



  function initialize(bool a, uint32 b, uint64 c) external {

    // Compute 3 trivial FHE formulas



    // _encryptedBool = a ^ false

    _encryptedBool = FHE.xor(FHE.asEbool(a), FHE.asEbool(false));



    // _encryptedUint32 = b + 1

    _encryptedUint32 = FHE.add(FHE.asEuint32(b), FHE.asEuint32(1));



    // _encryptedUint64 = c + 1

    _encryptedUint64 = FHE.add(FHE.asEuint64(c), FHE.asEuint64(1));



    // see `DecryptSingleValue.sol` for more detailed explanations

    // about FHE permissions and asynchronous user decryption requests.

    FHE.allowThis(_encryptedBool);

    FHE.allowThis(_encryptedUint32);

    FHE.allowThis(_encryptedUint64);



    FHE.allow(_encryptedBool, msg.sender);

    FHE.allow(_encryptedUint32, msg.sender);

    FHE.allow(_encryptedUint64, msg.sender);

  }



  function encryptedBool() public view returns (ebool) {

    return _encryptedBool;

  }



  function encryptedUint32() public view returns (euint32) {

    return _encryptedUint32;

  }



  function encryptedUint64() public view returns (euint64) {

    return _encryptedUint64;

  }

}
Previous
User decrypt single value
Next
Public Decrypt single value

Last updated 9 days ago

---

## 55. Public Decrypt single value | Examples | Protocol

_Source: https://docs.zama.org/protocol/examples/basic/decryption/heads-or-tails_

Copy
BASIC
DECRYPTION
Public Decrypt single value

This example showcases the public decryption mechanism and its corresponding on-chain verification in the case of a single value. The core assertion is to guarantee that a single given cleartext is the cryptographically verifiable result of the decryption of a single original on-chain ciphertext.

To run this example correctly, make sure the files are placed in the following directories:

.sol file → <your-project-root-dir>/contracts/

.ts file → <your-project-root-dir>/test/

This ensures Hardhat can compile and test your contracts as expected.

HeadsOrTails.sol
HeadsOrTails.ts
Copy
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;



import { FHE, ebool } from "@fhevm/solidity/lib/FHE.sol";

import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";



/**

 * @title HeadsOrTails

 * @notice Implements a simple Heads or Tails game demonstrating public, permissionless decryption

 *         using the FHE.makePubliclyDecryptable feature.

 * @dev Inherits from ZamaEthereumConfig to access FHE functions like FHE.randEbool() and FHE.verifySignatures().

 */

contract HeadsOrTails is ZamaEthereumConfig {

    constructor() {}



    /**

     * @notice Simple counter to assign a unique ID to each new game.

     */

    uint256 private counter = 0;



    /**

     * @notice Defines the entire state for a single Heads or Tails game instance.

     */

    struct Game {

        /// @notice The address of the player who chose Heads.

        address headsPlayer;

        /// @notice The address of the player who chose Tails.

        address tailsPlayer;

        /// @notice The core encrypted result. This is a publicly decryptable ebool handle.

        //          true means Heads won; false means Tails won.

        ebool encryptedHasHeadsWon;

        /// @notice The clear address of the final winner, set after decryption and verification.

        address winner;

    }



    /**

     * @notice Mapping to store all game states, accessible by a unique game ID.

     */

    mapping(uint256 gameId => Game game) public games;



    /**

     * @notice Emitted when a new game is started, providing the encrypted handle required for decryption.

     * @param gameId The unique identifier for the game.

     * @param headsPlayer The address choosing Heads.

     * @param tailsPlayer The address choosing Tails.

     * @param encryptedHasHeadsWon The encrypted handle (ciphertext) storing the result.

     */

    event GameCreated(

        uint256 indexed gameId,

        address indexed headsPlayer,

        address indexed tailsPlayer,

        ebool encryptedHasHeadsWon

    );



    /**

     * @notice Initiates a new Heads or Tails game, generates the result using FHE,

     *         and makes the result publicly available for decryption.

     * @param headsPlayer The player address choosing Heads.

     * @param tailsPlayer The player address choosing Tails.

     */

    function headsOrTails(address headsPlayer, address tailsPlayer) external {

        require(headsPlayer != address(0), "Heads player is address zero");

        require(tailsPlayer != address(0), "Tails player is address zero");

        require(headsPlayer != tailsPlayer, "Heads player and Tails player should be different");



        // true: Heads

        // false: Tails

        ebool headsOrTailsResult = FHE.randEbool();



        counter++;



        // gameId > 0

        uint256 gameId = counter;

        games[gameId] = Game({

            headsPlayer: headsPlayer,

            tailsPlayer: tailsPlayer,

            encryptedHasHeadsWon: headsOrTailsResult,

            winner: address(0)

        });



        // We make the result publicly decryptable.

        FHE.makePubliclyDecryptable(headsOrTailsResult);



        // You can catch the event to get the gameId and the encryptedHasHeadsWon handle

        // for further decryption requests, or create a view function.

        emit GameCreated(gameId, headsPlayer, tailsPlayer, games[gameId].encryptedHasHeadsWon);

    }



    /**

     * @notice Returns the number of games created so far.

     * @return The number of games created.

     */

    function getGamesCount() public view returns (uint256) {

        return counter;

    }



    /**

     * @notice Returns the encrypted ebool handle that stores the game result.

     * @param gameId The ID of the game.

     * @return The encrypted result (ebool handle).

     */

    function hasHeadsWon(uint256 gameId) public view returns (ebool) {

        return games[gameId].encryptedHasHeadsWon;

    }



    /**

     * @notice Returns the address of the game winner.

     * @param gameId The ID of the game.

     * @return The winner's address (address(0) if not yet revealed).

     */

    function getWinner(uint256 gameId) public view returns (address) {

        require(games[gameId].winner != address(0), "Game winner not yet revealed");

        return games[gameId].winner;

    }



    /**

     * @notice Verifies the provided (decryption proof, ABI-encoded clear value) pair against the stored ciphertext,

     *         and then stores the winner of the game.

     * @param gameId The ID of the game to settle.

     * @param abiEncodedClearGameResult The ABI-encoded clear value (bool) associated to the `decryptionProof`.

     * @param decryptionProof The proof that validates the decryption.

     */

    function recordAndVerifyWinner(

        uint256 gameId,

        bytes memory abiEncodedClearGameResult,

        bytes memory decryptionProof

    ) public {

        require(games[gameId].winner == address(0), "Game winner already revealed");



        // 1. FHE Verification: Build the list of ciphertexts (handles) and verify the proof.

        //    The verification checks that 'abiEncodedClearGameResult' is the true decryption

        //    of the 'encryptedHasHeadsWon' handle using the provided 'decryptionProof'.



        // Creating the list of handles in the right order! In this case the order does not matter since the proof

        // only involves 1 single handle.

        bytes32[] memory cts = new bytes32[](1);

        cts[0] = FHE.toBytes32(games[gameId].encryptedHasHeadsWon);



        // This FHE call reverts the transaction if the decryption proof is invalid.

        FHE.checkSignatures(cts, abiEncodedClearGameResult, decryptionProof);



        // 2. Decode the clear result and determine the winner's address.

        //    In this very specific case, the function argument `abiEncodedClearGameResult` could have been a simple

        //    `bool` instead of an abi-encoded bool. In this case, we should have compute abi.encode on-chain

        bool decodedClearGameResult = abi.decode(abiEncodedClearGameResult, (bool));

        address winner = decodedClearGameResult ? games[gameId].headsPlayer : games[gameId].tailsPlayer;



        // 3. Store the winner

        games[gameId].winner = winner;

    }

}
Previous
User decrypt multiple values
Next
Public Decrypt multiple values

Last updated 10 days ago

---

## 56. Public Decrypt multiple values | Examples | Protocol

_Source: https://docs.zama.org/protocol/examples/basic/decryption/highest-die-roll_

Copy
BASIC
DECRYPTION
Public Decrypt multiple values

This example showcases the public decryption mechanism and its corresponding on-chain verification in the case of multiple values. The core assertion is to guarantee that multiple given cleartexts are the cryptographically verifiable results of the decryption of multiple original on-chain ciphertexts.

To run this example correctly, make sure the files are placed in the following directories:

.sol file → <your-project-root-dir>/contracts/

.ts file → <your-project-root-dir>/test/

This ensures Hardhat can compile and test your contracts as expected.

HighestDieRoll.sol
HighestDieRoll.ts
Copy
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;



import { FHE, euint8 } from "@fhevm/solidity/lib/FHE.sol";

import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";



/**

 * @title HighestDieRoll

 * @notice Implements a simple 8-sided Die Roll game demonstrating public, permissionless decryption

 *         using the FHE.makePubliclyDecryptable feature.

 * @dev Inherits from ZamaEthereumConfig to access FHE functions like FHE.randEbool() and FHE.verifySignatures().

 */

contract HighestDieRoll is ZamaEthereumConfig {

    constructor() {}



    /**

     * @notice Simple counter to assign a unique ID to each new game.

     */

    uint256 private counter = 0;



    /**

     * @notice Defines the entire state for a single Heads or Tails game instance.

     */

    struct Game {

        /// @notice The address of the player who chose Heads.

        address playerA;

        /// @notice The address of the player who chose Tails.

        address playerB;

        /// @notice The core encrypted result. This is a publicly decryptable set of 4 handle.

        euint8 playerAEncryptedDieRoll;

        euint8 playerBEncryptedDieRoll;

        /// @notice The clear address of the final winne, address(0) if draw, set after decryption and verification.

        address winner;

        /// @notice true if the game result is revealed

        bool revealed;

    }



    /**

     * @notice Mapping to store all game states, accessible by a unique game ID.

     */

    mapping(uint256 gameId => Game game) public games;



    /**

     * @notice Emitted when a new game is started, providing the encrypted handle required for decryption.

     * @param gameId The unique identifier for the game.

     * @param playerA The address of playerA.

     * @param playerB The address of playerB.

     * @param playerAEncryptedDieRoll The encrypted die roll result of playerA.

     * @param playerBEncryptedDieRoll The encrypted die roll result of playerB.

     */

    event GameCreated(

        uint256 indexed gameId,

        address indexed playerA,

        address indexed playerB,

        euint8 playerAEncryptedDieRoll,

        euint8 playerBEncryptedDieRoll

    );



    /**

     * @notice Initiates a new highest die roll game, generates the result using FHE,

     *         and makes the result publicly available for decryption.

     * @param playerA The player address choosing Heads.

     * @param playerB The player address choosing Tails.

     */

    function highestDieRoll(address playerA, address playerB) external {

        require(playerA != address(0), "playerA is address zero");

        require(playerB != address(0), "playerB player is address zero");

        require(playerA != playerB, "playerA and playerB should be different");



        euint8 playerAEncryptedDieRoll = FHE.randEuint8();

        euint8 playerBEncryptedDieRoll = FHE.randEuint8();



        counter++;



        // gameId > 0

        uint256 gameId = counter;

        games[gameId] = Game({

            playerA: playerA,

            playerB: playerB,

            playerAEncryptedDieRoll: playerAEncryptedDieRoll,

            playerBEncryptedDieRoll: playerBEncryptedDieRoll,

            winner: address(0),

            revealed: false

        });



        // We make the results publicly decryptable.

        FHE.makePubliclyDecryptable(playerAEncryptedDieRoll);

        FHE.makePubliclyDecryptable(playerBEncryptedDieRoll);



        // You can catch the event to get the gameId and the die rolls handles

        // for further decryption requests, or create a view function.

        emit GameCreated(gameId, playerA, playerB, playerAEncryptedDieRoll, playerBEncryptedDieRoll);

    }



    /**

     * @notice Returns the number of games created so far.

     * @return The number of games created.

     */

    function getGamesCount() public view returns (uint256) {

        return counter;

    }



    /**

     * @notice Returns the encrypted euint8 handle that stores the playerA die roll.

     * @param gameId The ID of the game.

     * @return The encrypted result (euint8 handle).

     */

    function getPlayerADieRoll(uint256 gameId) public view returns (euint8) {

        return games[gameId].playerAEncryptedDieRoll;

    }



    /**

     * @notice Returns the encrypted euint8 handle that stores the playerB die roll.

     * @param gameId The ID of the game.

     * @return The encrypted result (euint8 handle).

     */

    function getPlayerBDieRoll(uint256 gameId) public view returns (euint8) {

        return games[gameId].playerBEncryptedDieRoll;

    }



    /**

     * @notice Returns the address of the game winner. If the game is finalized, the function returns `address(0)`

     *         if the game is a draw.

     * @param gameId The ID of the game.

     * @return The winner's address (address(0) if not yet revealed or draw).

     */

    function getWinner(uint256 gameId) public view returns (address) {

        require(games[gameId].revealed, "Game winner not yet revealed");

        return games[gameId].winner;

    }



    /**

     * @notice Returns `true` if the game result is publicly revealed, `false` otherwise.

     * @param gameId The ID of the game.

     * @return true if the game is publicly revealed.

     */

    function isGameRevealed(uint256 gameId) public view returns (bool) {

        return games[gameId].revealed;

    }



    /**

     * @notice Verifies the provided (decryption proof, ABI-encoded clear values) pair against the stored ciphertext,

     *         and then stores the winner of the game.

     * @param gameId The ID of the game to settle.

     * @param abiEncodedClearGameResult The ABI-encoded clear values (uint8, uint8) associated to the `decryptionProof`.

     * @param decryptionProof The proof that validates the decryption.

     */

    function recordAndVerifyWinner(

        uint256 gameId,

        bytes memory abiEncodedClearGameResult,

        bytes memory decryptionProof

    ) public {

        require(!games[gameId].revealed, "Game already revealed");



        // 1. FHE Verification: Build the list of ciphertexts (handles) and verify the proof.

        //    The verification checks that 'abiEncodedClearGameResult' is the true decryption

        //    of the '(playerAEncryptedDieRoll, playerBEncryptedDieRoll)' handle pair using

        //    the provided 'decryptionProof'.



        // Creating the list of handles in the right order! In this case the order does not matter since the proof

        // only involves 1 single handle.

        bytes32[] memory cts = new bytes32[](2);

        cts[0] = FHE.toBytes32(games[gameId].playerAEncryptedDieRoll);

        cts[1] = FHE.toBytes32(games[gameId].playerBEncryptedDieRoll);



        // This FHE call reverts the transaction if the decryption proof is invalid.

        FHE.checkSignatures(cts, abiEncodedClearGameResult, decryptionProof);



        // 2. Decode the clear result and determine the winner's address.

        //    In this very specific case, the function argument `abiEncodedClearGameResult` could have been replaced by two

        //    `uint8` instead of an abi-encoded uint8 pair. In this case, we should have to compute abi.encode on-chain

        (uint8 decodedClearPlayerADieRoll, uint8 decodedClearPlayerBDieRoll) = abi.decode(

            abiEncodedClearGameResult,

            (uint8, uint8)

        );



        // The die is an 8-sided die (d8) (1..8)

        decodedClearPlayerADieRoll = (decodedClearPlayerADieRoll % 8) + 1;

        decodedClearPlayerBDieRoll = (decodedClearPlayerBDieRoll % 8) + 1;



        address winner = decodedClearPlayerADieRoll > decodedClearPlayerBDieRoll

            ? games[gameId].playerA

            : (decodedClearPlayerADieRoll < decodedClearPlayerBDieRoll ? games[gameId].playerB : address(0));



        // 3. Store the revealed flag

        games[gameId].revealed = true;

        games[gameId].winner = winner;

    }

}
Previous
Public Decrypt single value
Next
Library installation and overview

Last updated 10 days ago

---

## 57. Library installation and overview | Examples | Protocol

_Source: https://docs.zama.org/protocol/examples/openzeppelin-confidential-contracts/openzeppelin_

Copy
OPENZEPPELIN CONFIDENTIAL CONTRACTS
Library installation and overview

This section contains comprehensive guides and examples for using OpenZeppelin's confidential smart contracts library with FHEVM. OpenZeppelin's confidential contracts library provides a secure, audited foundation for building privacy-preserving applications on fully homomorphic encryption (FHE) enabled blockchains.

The library includes implementations of popular standards like ERC20, ERC721, and ERC1155, adapted for confidential computing with FHEVM, ensuring your applications maintain privacy while leveraging battle-tested security patterns.

Getting Started

This guide will help you set up a development environment for working with OpenZeppelin's confidential contracts and FHEVM.

Prerequisites

Before you begin, ensure you have the following installed:

Node.js >= 20

Hardhat ^2.24

Access to an FHEVM-enabled network and the Zama gateway/relayer

Project Setup

Clone the FHEVM Hardhat template repository:

Copy
git clone https://github.com/zama-ai/fhevm-hardhat-template conf-token

cd conf-token

Install project dependencies:

Copy
npm ci

Install OpenZeppelin's confidential contracts library:

Copy
npm i @openzeppelin/confidential-contracts

Compile the contracts:

Copy
npm run compile

Run the test suite:

Copy
npm test
Available Guides

Explore the following guides to learn how to implement confidential contracts using OpenZeppelin's library:

ERC7984 Standard - Learn about the ERC7984 standard for confidential tokens

ERC7984 Tutorial - Step-by-step tutorial for implementing ERC7984 tokens

ERC7984 to ERC20 Wrapper - Convert between confidential and public token standards

Swap ERC7984 to ERC20 - Implement cross-standard token swapping

Swap ERC7984 to ERC7984 - Confidential token-to-token swapping

Vesting Wallet - Implement confidential token vesting mechanisms

Previous
Public Decrypt multiple values
Next
ERC7984 Standard

Last updated 2 months ago

---

## 58. ERC7984 Standard | Examples | Protocol

_Source: https://docs.zama.org/protocol/examples/openzeppelin-confidential-contracts/erc7984_

Copy
OPENZEPPELIN CONFIDENTIAL CONTRACTS
ERC7984 Standard

This example demonstrates how to create a confidential token using OpenZeppelin's smart contract library powered by ZAMA's FHEVM.

To run this example correctly, make sure you clone the fhevm-hardhat-template and that the files are placed in the following directories:

.sol file → <your-project-root-dir>/contracts/

.ts file → <your-project-root-dir>/test/

This ensures Hardhat can compile and test your contracts as expected.

ERC7984Example.sol
ERC7984Example.test.ts
ERC7984Example.fixture.ts
Copy
// SPDX-License-Identifier: BSD-3-Clause-Clear

pragma solidity ^0.8.24;



import {Ownable2Step, Ownable} from "@openzeppelin/contracts/access/Ownable2Step.sol";

import {FHE, externalEuint64, euint64} from "@fhevm/solidity/lib/FHE.sol";

import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

import {ERC7984} from "@openzeppelin/confidential-contracts/token/ERC7984.sol";



contract ERC7984Example is ZamaEthereumConfig, ERC7984, Ownable2Step {

    constructor(

        address owner,

        uint64 amount,

        string memory name_,

        string memory symbol_,

        string memory tokenURI_

    ) ERC7984(name_, symbol_, tokenURI_) Ownable(owner) {

        euint64 encryptedAmount = FHE.asEuint64(amount);

        _mint(owner, encryptedAmount);

    }

}
Previous
Library installation and overview
Next
ERC7984 Tutorial

Last updated 9 days ago

---

## 59. ERC7984 Tutorial | Examples | Protocol

_Source: https://docs.zama.org/protocol/examples/openzeppelin-confidential-contracts/erc7984/erc7984-tutorial_

Copy
OPENZEPPELIN CONFIDENTIAL CONTRACTS
ERC7984 STANDARD
ERC7984 Tutorial

This tutorial explains how to create a confidential fungible token using Fully Homomorphic Encryption (FHE) and the OpenZeppelin smart contract library. By following this guide, you will learn how to build a token where balances and transactions remain encrypted while maintaining full functionality.

Why FHE for confidential tokens?

Confidential tokens make sense in many real-world scenarios:

Privacy: Users can transact without revealing their exact balances or transaction amounts

Regulatory Compliance: Maintains privacy while allowing for selective disclosure when needed

Business Intelligence: Companies can keep their token holdings private from competitors

Personal Privacy: Individuals can participate in DeFi without exposing their financial position

Audit Trail: All transactions are still recorded on-chain, just in encrypted form

FHE enables these benefits by allowing computations on encrypted data without decryption, ensuring privacy while maintaining the security and transparency of blockchain.

Project Setup

Before starting this tutorial, ensure you have:

Installed the FHEVM hardhat template

Set up the OpenZeppelin confidential contracts library

For help with these steps, refer to the following tutorial:

Setting up OpenZeppelin confidential contracts

Understanding the architecture

Our confidential token will inherit from several key contracts:

ERC7984 - OpenZeppelin's base for confidential tokens

Ownable2Step - Access control for minting and administrative functions

ZamaEthereumConfig - FHE configuration for the Ethereum mainnet or Ethereum Sepolia testnet networks

The base smart contract

Let's create our confidential token contract in contracts/ERC7984Example.sol. This contract will demonstrate the core functionality of ERC7984 tokens.

A few key points about this implementation:

The contract mints an initial supply with a clear (non-encrypted) amount during deployment

The initial mint is done once during construction, establishing the token's total supply

All subsequent transfers will be fully encrypted, preserving privacy

The contract inherits from ERC7984 for confidential token functionality and Ownable2Step for secure access control

While this example uses a clear initial mint for simplicity, in production you may want to consider:

Using encrypted minting for complete privacy from genesis

Implementing a more sophisticated minting schedule

Overriding some privacy assumptions

Copy
// SPDX-License-Identifier: BSD-3-Clause-Clear

pragma solidity ^0.8.24;



import {Ownable2Step, Ownable} from "@openzeppelin/contracts/access/Ownable2Step.sol";

import {FHE, externalEuint64, euint64} from "@fhevm/solidity/lib/FHE.sol";

import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

import {ERC7984} from "@openzeppelin/confidential-contracts/token/ERC7984.sol";



contract ERC7984Example is ZamaEthereumConfig, ERC7984, Ownable2Step {

    constructor(

        address owner,

        uint64 amount,

        string memory name_,

        string memory symbol_,

        string memory tokenURI_

    ) ERC7984(name_, symbol_, tokenURI_) Ownable(owner) {

        euint64 encryptedAmount = FHE.asEuint64(amount);

        _mint(owner, encryptedAmount);

    }

}
Test workflow

Now let's test the token transfer process. We'll create a test that:

Encrypts a transfer amount

Sends tokens from owner to recipient

Verifies the transfer was successful by checking balance handles

Create a new file test/ERC7984Example.test.ts with the following test:

Copy
import { expect } from 'chai';

import { ethers, fhevm } from 'hardhat';



describe('ERC7984Example', function () {

  let token: any;

  let owner: any;

  let recipient: any;

  let other: any;



  const INITIAL_AMOUNT = 1000;

  const TRANSFER_AMOUNT = 100;



  beforeEach(async function () {

    [owner, recipient, other] = await ethers.getSigners();



    // Deploy ERC7984Example contract

    token = await ethers.deployContract('ERC7984Example', [

      owner.address,

      INITIAL_AMOUNT,

      'Confidential Token',

      'CTKN',

      'https://example.com/token'

    ]);

  });



  describe('Confidential Transfer Process', function () {

    it('should transfer tokens from owner to recipient', async function () {

      // Create encrypted input for transfer amount

      const encryptedInput = await fhevm

        .createEncryptedInput(await token.getAddress(), owner.address)

        .add64(TRANSFER_AMOUNT)

        .encrypt();



      // Perform the confidential transfer

      await expect(token

        .connect(owner)

        ['confidentialTransfer(address,bytes32,bytes)'](

          recipient.address,

          encryptedInput.handles[0],

          encryptedInput.inputProof

        )).to.not.be.reverted;



      // Check that both addresses have balance handles (without decryption for now)

      const recipientBalanceHandle = await token.confidentialBalanceOf(recipient.address);

      const ownerBalanceHandle = await token.confidentialBalanceOf(owner.address);

      expect(recipientBalanceHandle).to.not.be.undefined;

      expect(ownerBalanceHandle).to.not.be.undefined;

    });

  });

});

To run the tests, use:

Copy
npx hardhat test test/ERC7984Example.test.ts
Advanced features and extensions

The basic ERC7984Example contract provides core functionality, but you can extend it with additional features. For example:

Minting functions

Visible Mint - Allows the owner to mint tokens with a clear amount:

Copy
    function mint(address to, uint64 amount) external onlyOwner {

        _mint(to, FHE.asEuint64(amount));

    }

When to use: Prefer this for public/tokenomics-driven mints where transparency is desired (e.g., scheduled emissions).

Privacy caveat: The minted amount is visible in calldata and events; use confidentialMint for privacy.

Access control: Consider replacing onlyOwner with role-based access via AccessControl (e.g., MINTER_ROLE) for multi-signer workflows.

Supply caps: If you need a hard cap, add a check before _mint and enforce it consistently for both visible and confidential flows.

Confidential Mint - Allows minting with encrypted amounts for enhanced privacy:

Copy
    function confidentialMint(

        address to,

        externalEuint64 encryptedAmount,

        bytes calldata inputProof

    ) external onlyOwner returns (euint64 transferred) {

        return _mint(to, FHE.fromExternal(encryptedAmount, inputProof));

    }

Inputs: encryptedAmount and inputProof are produced off-chain with the SDK. Always validate and revert on malformed inputs.

Gas considerations: Confidential operations cost more gas; batch mints sparingly and prefer fewer larger mints to reduce overhead.

Auditing: While amounts stay private, you still get a verifiable audit trail of mints (timestamps, sender, recipient).

Example (Hardhat SDK):

Copy
const enc = await fhevm

  .createEncryptedInput(await token.getAddress(), owner.address)

  .add64(1_000)

  .encrypt();



await token.confidentialMint(recipient.address, enc.handles[0], enc.inputProof);
Burning functions

Visible Burn - Allows the owner to burn tokens with a clear amount:

Copy
    function burn(address from, uint64 amount) external onlyOwner {

        _burn(from, FHE.asEuint64(amount));

    }

Confidential Burn - Allows burning with encrypted amounts:

Copy
    function confidentialBurn(

        address from,

        externalEuint64 encryptedAmount,

        bytes calldata inputProof

    ) external onlyOwner returns (euint64 transferred) {

        return _burn(from, FHE.fromExternal(encryptedAmount, inputProof));

    }

Authorization: Burning from arbitrary accounts is powerful; consider stronger controls (roles, multisig, timelocks) or user-consented burns.

Event strategy: Decide whether to emit custom events revealing intent (not amounts) for better observability and offchain indexing.

Error surfaces: Expect balance/allowance-like failures if encrypted amount exceeds balance; test both success and revert paths.

Example (Hardhat SDK):

Copy
const enc = await fhevm

  .createEncryptedInput(await token.getAddress(), owner.address)

  .add64(250)

  .encrypt();



await token.confidentialBurn(holder.address, enc.handles[0], enc.inputProof);
Total supply visibility

If you want the owner to be able to view the total supply (useful for administrative purposes):

Copy
    function _update(address from, address to, euint64 amount) internal virtual override returns (euint64 transferred) {

        transferred = super._update(from, to, amount);

        FHE.allow(confidentialTotalSupply(), owner());

    }

What this does: Grants the owner permission to decrypt the latest total supply handle after every state-changing update.

Operational model: The owner can call confidentialTotalSupply() and use their off-chain key material to decrypt the returned handle.

Security considerations:

If ownership changes, ensure only the new owner can decrypt going forward. With Ownable2Step, this function will automatically allow the current owner().

Be mindful of compliance: granting supply visibility may be considered privileged access; document who holds the key and why.

Alternatives: If you want organization-wide access, grant via a dedicated admin contract that holds decryption authority instead of a single EOA.

Previous
ERC7984 Standard
Next
ERC7984 to ERC20 Wrapper

Last updated 9 days ago

---

## 60. ERC7984 to ERC20 Wrapper | Examples | Protocol

_Source: https://docs.zama.org/protocol/examples/openzeppelin-confidential-contracts/erc7984/erc7984erc20wrappermock_

Copy
OPENZEPPELIN CONFIDENTIAL CONTRACTS
ERC7984 STANDARD
ERC7984 to ERC20 Wrapper

This example demonstrates how to wrap between the ERC20 token into a ERC7984 token using OpenZeppelin's smart contract library powered by ZAMA's FHEVM.

To run this example correctly, make sure the files are placed in the following directories:

.sol file → <your-project-root-dir>/contracts/

.ts file → <your-project-root-dir>/test/

This ensures Hardhat can compile and test your contracts as expected.

ERC7984ERC20WrapperExample.sol

Previous
ERC7984 Tutorial
Next
Swap ERC7984 to ERC20

Last updated 9 days ago

---

## 61. Swap ERC7984 to ERC20 | Examples | Protocol

_Source: https://docs.zama.org/protocol/examples/openzeppelin-confidential-contracts/erc7984/swaperc7984toerc20_

Copy
OPENZEPPELIN CONFIDENTIAL CONTRACTS
ERC7984 STANDARD
Swap ERC7984 to ERC20

This example demonstrates how to swap between a confidential token - the ERC7984 and the ERC20 tokens using OpenZeppelin's smart contract library powered by ZAMA's FHEVM.

To run this example correctly, make sure the files are placed in the following directories:

.sol file → <your-project-root-dir>/contracts/

.ts file → <your-project-root-dir>/test/

This ensures Hardhat can compile and test your contracts as expected.

SwapERC7984ToERC20.sol

Previous
ERC7984 to ERC20 Wrapper
Next
Swap ERC7984 to ERC7984

Last updated 25 days ago

---

## 62. Swap ERC7984 to ERC7984 | Examples | Protocol

_Source: https://docs.zama.org/protocol/examples/openzeppelin-confidential-contracts/erc7984/swaperc7984toerc7984_

Copy
OPENZEPPELIN CONFIDENTIAL CONTRACTS
ERC7984 STANDARD
Swap ERC7984 to ERC7984

This example demonstrates how to swap between a confidential token - the ERC7984 and the ERC20 tokens using OpenZeppelin's smart contract library powered by ZAMA's FHEVM.

To run this example correctly, make sure the files are placed in the following directories:

.sol file → <your-project-root-dir>/contracts/

.ts file → <your-project-root-dir>/test/

This ensures Hardhat can compile and test your contracts as expected.

SwapERC7984ToERC20.sol

Previous
Swap ERC7984 to ERC20
Next
Vesting Wallet

Last updated 25 days ago

---

## 63. Vesting Wallet | Examples | Protocol

_Source: https://docs.zama.org/protocol/examples/openzeppelin-confidential-contracts/vesting-wallet_

Copy
OPENZEPPELIN CONFIDENTIAL CONTRACTS
Vesting Wallet

This example demonstrates how to create a vesting wallet using OpenZeppelin's smart contract library powered by ZAMA's FHEVM.

VestingWalletConfidential receives ERC7984 tokens and releases them to the beneficiary according to a confidential, linear vesting schedule.

To run this example correctly, make sure the files are placed in the following directories:

.sol file → <your-project-root-dir>/contracts/

.ts file → <your-project-root-dir>/test/

This ensures Hardhat can compile and test your contracts as expected.

VestingWalletExample.sol
VestingWalletExample.test.ts
VestingWalletExample.fixture.ts
Copy
// SPDX-License-Identifier: BSD-3-Clause-Clear

pragma solidity ^0.8.24;



import {FHE, ebool, euint64, euint128} from "@fhevm/solidity/lib/FHE.sol";

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

import {ReentrancyGuardTransient} from "@openzeppelin/contracts/utils/ReentrancyGuardTransient.sol";

import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

import {IERC7984} from "../interfaces/IERC7984.sol";



/**

 * @title VestingWalletExample

 * @dev A simple example demonstrating how to create a vesting wallet for ERC7984 tokens

 * 

 * This contract shows how to create a vesting wallet that receives ERC7984 tokens

 * and releases them to the beneficiary according to a confidential, linear vesting schedule.

 * 

 * This is a non-upgradeable version for demonstration purposes.

 */

contract VestingWalletExample is Ownable, ReentrancyGuardTransient, ZamaEthereumConfig {

    mapping(address token => euint128) private _tokenReleased;

    uint64 private _start;

    uint64 private _duration;



    /// @dev Emitted when releasable vested tokens are released.

    event VestingWalletConfidentialTokenReleased(address indexed token, euint64 amount);



    constructor(

        address beneficiary,

        uint48 startTimestamp,

        uint48 durationSeconds

    ) Ownable(beneficiary) {

        _start = startTimestamp;

        _duration = durationSeconds;

    }



    /// @dev Timestamp at which the vesting starts.

    function start() public view virtual returns (uint64) {

        return _start;

    }



    /// @dev Duration of the vesting in seconds.

    function duration() public view virtual returns (uint64) {

        return _duration;

    }



    /// @dev Timestamp at which the vesting ends.

    function end() public view virtual returns (uint64) {

        return start() + duration();

    }



    /// @dev Amount of token already released

    function released(address token) public view virtual returns (euint128) {

        return _tokenReleased[token];

    }



    /**

     * @dev Getter for the amount of releasable `token` tokens. `token` should be the address of an

     * {IERC7984} contract.

     */

    function releasable(address token) public virtual returns (euint64) {

        euint128 vestedAmount_ = vestedAmount(token, uint48(block.timestamp));

        euint128 releasedAmount = released(token);

        ebool success = FHE.ge(vestedAmount_, releasedAmount);

        return FHE.select(success, FHE.asEuint64(FHE.sub(vestedAmount_, releasedAmount)), FHE.asEuint64(0));

    }



    /**

     * @dev Release the tokens that have already vested.

     *

     * Emits a {VestingWalletConfidentialTokenReleased} event.

     */

    function release(address token) public virtual nonReentrant {

        euint64 amount = releasable(token);

        FHE.allowTransient(amount, token);

        euint64 amountSent = IERC7984(token).confidentialTransfer(owner(), amount);



        // This could overflow if the total supply is resent `type(uint128).max/type(uint64).max` times. This is an accepted risk.

        euint128 newReleasedAmount = FHE.add(released(token), amountSent);

        FHE.allow(newReleasedAmount, owner());

        FHE.allowThis(newReleasedAmount);

        _tokenReleased[token] = newReleasedAmount;

        emit VestingWalletConfidentialTokenReleased(token, amountSent);

    }



    /**

     * @dev Calculates the amount of tokens that have been vested at the given timestamp.

     * Default implementation is a linear vesting curve.

     */

    function vestedAmount(address token, uint48 timestamp) public virtual returns (euint128) {

        return _vestingSchedule(FHE.add(released(token), IERC7984(token).confidentialBalanceOf(address(this))), timestamp);

    }



    /// @dev This returns the amount vested, as a function of time, for an asset given its total historical allocation.

    function _vestingSchedule(euint128 totalAllocation, uint48 timestamp) internal virtual returns (euint128) {

        if (timestamp < start()) {

            return euint128.wrap(0);

        } else if (timestamp >= end()) {

            return totalAllocation;

        } else {

            return FHE.div(FHE.mul(totalAllocation, (timestamp - start())), duration());

        }

    }

}
Previous
Swap ERC7984 to ERC7984

Last updated 9 days ago

---

## 64. Zama Confidential Blockchain Protocol Litepaper | Zama Protocol Litepaper | Protocol

_Source: https://docs.zama.org/protocol/zama-protocol-litepaper_

Copy
Zama Confidential Blockchain Protocol Litepaper

This litepaper describes Zama’s Confidential Blockchain Protocol, which enables confidential smart contracts on existing public blockchains. It includes details about the protocol and token, as well as documentation for node operators. 

 To read Zama's FHEVM technical whitepaper, please see on Github.

The blockchain confidentiality dilemma

Why do we need blockchain? This question often comes along when discussing building decentralized applications (dapps). After all, most things we use today are not blockchain based and work just fine. However, there are some applications where the cost of blindly trusting a third party and being wrong is too high, such as when dealing with financial assets, identity or governance. In those cases, consumers and companies want strong guarantees that whatever service is being provided is done correctly, while service providers want to ensure their users have the right to use the assets/data they claim.

Blockchains solve this by enabling anyone to publicly verify that a request was executed according to a predetermined logic, and that the resulting state of the overall system is correct. Service providers and their customers no longer have to trust each other, as the integrity of the transaction is guaranteed by the blockchain itself.

One major issue with public verifiability however is that it requires disclosing all the transactions and data to everyone, as keeping them private would prevent verifiability in the first place. This lack of confidentiality has been a major hindrance to global adoption of blockchains, as the very data it is supposed to be used for (money, identity, …) is highly sensitive by nature. Without confidentiality, blockchain cannot reach mass adoption.

The Zama Confidential Blockchain Protocol

The Zama Confidential Blockchain Protocol (or simply the Zama Protocol) enables issuing, managing and trading assets confidentially on existing public blockchains. It is the most advanced confidentiality protocol to date, offering:

End-to-end encryption of transaction inputs and state: no-one can see the data, not even node operators.

Composability between confidential contracts, as well as with non-confidential ones. Developers can build on top of other contracts, tokens and dapps.

Programmable confidentiality: smart contracts define who can decrypt what, meaning developers have full control over confidentiality rules in their applications.

The Zama Protocol is not a new L1 or L2, but rather a cross-chain confidentiality layer sitting on top of existing chains. As such, users don’t need to bridge to a new chain and can interact with confidential dapps from wherever they choose.

It leverages Zama’s state-of-the-art Fully Homomorphic Encryption (FHE) technology, which enables computing directly on encrypted data. FHE has long been considered the “holy grail” of cryptography, as it allows end-to-end encryption for any application, onchain or offchain. We believe that just like the internet went from zero encryption with HTTP to encrypting data in transit with HTTPS, the next natural step will be to use FHE to enable end-to-end encryption by default in every application, something we call HTTPZ.

Until recently however, FHE was too slow, too limited in terms of applications it could support, and too difficult to use for developers. This is what our team at Zama has spent the last 5 years solving. We now have a highly efficient FHE technology that can support any type of application, using common programming languages such as Solidity and Python, while being over 100x faster than 5 years ago. Importantly, Zama’s FHE technology is already post-quantum, meaning there is no known quantum algorithms that can break it.

While FHE is the core technology used in the Zama Protocol, we also leverage Multi-Party Computation (MPC) and Zero-Knowledge Proofs (ZK) to address the shortcomings of other confidentiality solutions:

FHE enables confidentiality while being fully publicly verifiable (anyone can recompute the FHE operations and verify them). Using GPUs will soon allow scaling to 100+ transactions/s while dedicated hardware accelerators (FPGAs and ASICs) will enable scaling to thousands of transactions per second.

MPC enables decentralizing the global network key, ensuring no single party can access it. Using MPC only to generate keys and decrypt data for users minimizes latency and communication, thereby making it far more scalable and decentralized than using it for private computation.

ZK ensures the encrypted inputs provided by users were actually encrypted correctly. Using ZK only for this specific purpose makes the ZK proofs lightweight and cheap to generate in a browser or mobile app.

The table below summarizes the advantages of the Zama Protocol versus other technologies used in confidential blockchain protocols:

Zama
Other FHE
MPC
ZK
TEE
Private Chains

Secure

✅

✅

✅

✅

❌

✅

Decentralized

✅

✅

✅

✅

✅

❌

Verifiable

✅

✅

❌

✅

❌

❌

Composable

✅

✅

✅

❌

✅

✅

Scalable

✅

❌

✅

✅

✅

✅

Easy to use

✅

❌

❌

❌

✅

✅

Roadmap

The Zama Protocol leverages years of research and development work done at Zama. The testnet is already live, and the mainnet is planned for 2025, with a TGE at the end of the year. The timeline is as follows:

Public Testnet (already live). This will allow anyone to deploy and test their confidential dapps, as well as enabling operators to coordinate and get used to the operations.

Ethereum Mainnet + TGE (Q4 2025). This will be the first official mainnet bringing confidentiality to Ethereum. 

Other EVM chains (H1 2026). We will add more EVM chains to the Zama protocol to enable cross-chain confidential assets and applications.

Solana support (H2 2026). After an initial phase of EVM-only support, we will deploy the Zama Protocol on Solana, enabling confidential SVM applications.

Use cases

Confidential smart contracts enable a new design space for blockchain applications, in particular when applied to finance, identity and governance. If we look at web2, it is clear that most applications do not share all the data publicly, and thus it is likely that the vast majority of blockchain applications are yet to be built, now that confidentiality is no longer an issue.

Here are some example use cases:

Finance

Confidential payments. Stablecoins are one the most successful use case for blockchain, with trillions in yearly volume. Everything from credit card payments to salaries, remittances and banking rails is now moving onchain. One of the absolute key requirement however is confidentiality and compliance. Thanks to FHE and the Zama Protocol, this is now possible: balances and transfer amounts are kept encrypted end-to-end, while payment providers can embed compliance features into the token contract directly. You can read more about confidential, compliant payments here.

Tokenization & RWAs. The tokenization of financial assets is one of the main adoption drivers of blockchain for large institutions. From fund shares to stocks, bonds or derivatives, there is up to $100T of assets that could potentially move onchain. Due to confidentiality and compliance issues however, TradFi institutions have had to rely on private blockchains, making it difficult to ensure interoperability between institutions. With the Zama Protocol, they can now use existing public blockchain such as Ethereum or Solana to tokenize and trade their assets, while keeping their activity and investor identity confidential. They can also ensure KYC/AML checks are done in the smart contracts directly, without revealing sensitive information to others. You can read more about this use case in the report published by JP Morgan - Kynexis, in which they built a proof-of-concept using Zama’s technology.

Confidential DeFi. DeFi has redefined finance by allowing anyone to participate and earn yield, but it suffers from two major issues: people don’t like sharing how much they own, and bots front-running transactions makes it expensive for end users to swap assets onchain. FHE can solve both issues by enabling end-to-end encrypted swaps, where the amount and possibly asset is kept private at all times. Some other use cases includes confidential lending, onchain credit scoring, option pricing and more.

Tokens

Sealed-bid auctions. Sell assets such as NFTs or tokens in an onchain sealed-bid auction. Each participant places an encrypted bid onchain. When the auction ends, the highest bidder(s) win the item(s), without revealing any of the bids. Not only does this enable better price discovery, it also prevents bots from stealing the auction by monitoring the mempool. This is a particularly effective method for public token sales.

Confidential distributions. Distributing tokens currently requires disclosing publicly how much each address receives. Whether it’s for airdrops, grants, investors or developers, keeping the distributed amounts private is paramount to privacy and security onchain. With FHE, protocols can distribute their token confidentially, run vesting on those encrypted tokens, enable confidential staking and more.

Identity and Governance

Composable onchain identity. Offchain, we use our identities all the time, from buying products online to booking plane tickets. Doing so onchain however would leak sensitive information such as your name, address, social security number and more. With FHE however, you can have a complete Decentralized ID (DID) + Verifiable Credentials (VC) system onchain, where your identity is encrypted while being fully composable with decentralized applications. Just like you can have account abstraction, you can now have identity abstraction. This is also essential for compliance in onchain payments and tokenization, as it can be used by smart contracts to verify claims in a decentralized, private manner.

Confidential governance. The idea of onchain voting, whether for DAOs, companies or governments, has been explored for as long as blockchains exist. But having the votes cast publicly onchain can lead to biases, blackmailing, or bribing. With FHE, votes (and numbers of tokens staked) can be kept private, ensuring only the final tally is revealed, and not the individual votes.

Other examples

Onchain corporations. Managing a company onchain would be impossible without the promise of confidentiality. Indeed, information such as the cap table, financials, board votes, customers, and employee registers should not be disclosed publicly. With FHE, all this information could be kept onchain, allowing smart contracts to automate many day-to-day company operations. ‍‍

Prediction markets. ‍‍Prediction markets are based on the wisdom of the crowd concept: the average prediction of a large number of people tend to be close to the correct outcome. However, this only works if participants are not biased by previous predictions. The Zama Protocol solves this by enabling prediction markets where predictions are encrypted until revealed periodically, leading to better precision in outcomes.

Data marketplaces for AI. ‍‍AI strives on data. With FHE, users can selectively share and sell their data with companies wishing to train AI models. More than this, models can potentially be trained encrypted, with only the result being decrypted, ensuring that users have a constant stream of revenue for their data vs selling it only once and it being used forever.

These are just some examples of what can be done today. We believe that FHE, through Zama’s Protocol, will enable unprecedented liquidity, enabling users and companies to move onchain. With time and scale, it would even become possible to run entire companies, cities or even countries onchain, including their financial and identity infrastructure, elections, currency, taxes, land, car and company registries. Confidential blockchains don’t just enable programmable money: they enable programmable public infrastructure.

Creating confidential applications

Creating a confidential dapp using existing solutions often requires learning a new (niche) programming language, using dedicated (and often limited) developer tools, and mastering advanced cryptographic concepts.

The Zama Protocol on the other hand enables developers to create confidential dapps directly in Solidity, without any knowledge of cryptography. Developers simply need to import our library (called FHEVM) and write their logic using the provided operators. You can get started today for free by checking out the developer documentation here.

The following example shows an example confidential token contract, which can be deployed on any supported chain such as Ethereum.

Copy
pragma solidity ^0.8.26;



import "fhevm/lib/FHE.sol";

import { IConfidentialFungibleToken } from "./IConfidentialFungibleToken.sol";



abstract contract ConfidentialFungibleToken is IConfidentialFungibleToken {



    uint64 internal _totalSupply;

    string internal _name;

    string internal _symbol;



    // Balances are encrypted

    mapping(address account => euint64 balance) internal _balances;



    // Transfer an encrypted amount

     function transfer(address to, externalEuint64 encryptedAmount, bytes calldata inputProof) public virtual returns (euint64) {



        // Verify the input is correct and cast to euint64

        euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);



        // Check if the user has enough balance, otherwise set the transfer amount to zero

        euint64 transferValue = FHE.select(FHE.le(amount, _balances[msg.sender]), amount, FHE.asEuint64(0));



        // Make the transfer

        _balances[to] = FHE.add(_balances[to], transferValue);

        _balances[from] = FHE.sub(_balances[from], transferValue);



        // Allow users to see their balances, and the contract to update it

        FHE.allow(_balances[to], to);

        FHE.allow(_balances[from], from);

        FHE.allowThis(_balances[to]);

        FHE.allowThis(_balances[from]);



        return transferValue;

    }

}

Simply replace the integer operations by their FHE equivalent, then specify who can decrypt the balances. Of course, developers can build much more complicated applications, such as AMMs, lending, and more. On top of the smart contract library, we also provide a Javascript SDK that streamlines the encryption and decryption client-side, making it almost invisible to end-users.

The access control system used by the Zama Protocol is extremely powerful. By allowing contracts to define who can decrypt which value in it, it makes confidentiality (and compliance) fully programmable. There is no assumption at the protocol or user level, everything is encoded in the application logic itself, allowing companies to choose whether they want to offer end-to-end encryption (aka nobody sees anything, not even the companies building the dapp), or onchain encryption (aka the web2 model: only the user and service provider see the data, but nobody else onchain).

The FHEVM library used by the Zama Protocol supports the following encrypted types and operations:

Type

Symbol

Logical

Arithmetic

Comparison

Shifts

Branching

Integer (unsigned)

euint8…256

and, or, xor, not

add, sub, mul, div, rem, neg, abs, sign

eq, neq, gt, lt, ge, le, min, max

shl, shr, rotl, rotr

select

Integer (signed)

eint8…256

and, or, xor, not

add, sub, mul, div, rem, neg, abs, sign

eq, neq, gt, lt, ge, le, min, max

shl, shr, rotl, rotr

select

Boolean

ebool

and, or, xor, not

eq, neq

select

Bytes

ebytes1…256

and, or, xor, not

eq, neq

shl, shr, rotl, rotr

select

Address

eaddress

eq, neq

select

To make deploying dapps easier, we are also building a “Zama Standard Library”: a set of audited, highly optimized smart contracts for common use cases such as:

confidential tokens and RWAs

confidential NFTs

wrappers to bridge between confidential assets and traditional ones

a confidential identity stack that enables DID/VC onchain

UniV2-style confidential AMMs

Confidential vesting

Confidential airdrops

Sealed-bid auctions

Confidential governance

We will continue adding more over time as we see new use cases appearing.

Technical details

Blockchains typically only support limited computations, making it impossible to run FHE natively on Ethereum and other L1/L2s. To address this issue, we designed the Zama Protocol based on two core ideas: symbolic execution and threshold decryption.

‍Symbolic execution

The idea behind symbolic execution is that whenever a contract calls the Zama FHEVM Solidity library on the host chain (the L1/L2 where the confidential dapp is deployed) to perform an FHE operation, the host chain itself doesn’t do any actual FHE computation; instead, it produces a pointer to the result and emits an event to notify a network of coprocessors, who do the actual FHE computation. This has many advantages:

The host chain does not need to change anything, run expensive FHE operations or use specific hardware.

The host chain is not slowed down by FHE, so non-FHE transactions can be executed as fast as they always have been

FHE operations can be executed in parallel, rather than sequentially, dramatically increasing throughput.

Since all ciphertexts on the host chain are simply pointers (the actual data is stored by coprocessors), FHE operations can be chained just like regular operations, without needing to wait for the previous ones to complete. The only time we need to wait for a ciphertext to be computed is when it has to be decrypted.

From a security perspective, everything the coprocessors do is publicly verifiable, and anyone can just recompute the ciphertexts to verify the result. Initially, we use multiple coprocessors with a majority consensus, but longer term the goal is to enable anyone to compete to execute FHE operations, leveraging ZK-FHE to prove the correctness.

Threshold decryption

To maintain composability onchain, all ciphertexts need to be encrypted under the same public key. This means the private decryption key has to be secured in a way that prevents illegitimate decryption of ciphertexts. The Zama Protocol solves this by splitting the private key amongst multiple parties, using a dedicated threshold MPC protocol as its Key Management Service (KMS).

In order for a user or contract to decrypt a value, they need to first have been explicitly allowed to do so by the contract that produced the value on the host chain. Decrypting the result is then a simple request to the Zama Gateway, which acts as an orchestrator for the protocol and forwards the request to the KMS parties.

This again ensures that all decryption requests are publicly visible, and thus anyone can verify they match the access control logic defined by smart contracts.

Components

The Zama Protocol is composed of several core components:

Host Chains: the L1s and L2s that are supported by the Zama Protocol, and on which developers deploy their confidential dapps.

FHEVM Library: the library that developers use to create confidential smart contracts.

FHEVM Executor: the contract that is called by dapps to execute FHE operations on the Host Chain. Each time a contract uses an FHE operation, the Executor automatically emits an event to notify Coprocessors to compute it.

Access Control List (ACL): a smart contract deployed on each Host Chain, which keeps tracks of who can decrypt what. The ACL is central to the operations of the Zama Protocol and is used both to verify a contract is allowed to compute on an encrypted value, and that an address is allowed to decrypt it. Each time a contract allows an address to use a ciphertext, an event is emitted and relayed by Coprocessors to the Gateway, enabling the aggregation of all Host Chain ACLs into a single Gateway ACL used by the KMS to authenticate decryption requests.

$ZAMA token: the native token of the Zama Protocol, used for payment of the fees, staking and governance.

Gateway: a set of smart contracts used to orchestrate the Zama Protocol, and allow users to request verification of their encrypted inputs, decryption of ciphertexts and bridging of encrypted assets between Host Chains. Each of these operations is a transaction to the Gateway contracts, and requires paying a small fee in $ZAMA tokens. While the Gateway contracts could be deployed on any L1 or L2, we opted to run a dedicated Arbitrum rollup for the Zama Protocol, ensuring maximal performance and cost efficiency. Note that our rollup serves only the Zama Protocol and doesn’t allow third party contracts to be deployed on it.

Coprocessors: a set of nodes responsible for 1. verifying encrypted inputs from users, 2. running the actual FHE computations and storing the resulting ciphertexts, 3. relaying ACL events to the Gateway. The Zama Protocol uses multiple coprocessors, which each commit their results to the Gateway, which in turns runs a majority consensus. All tasks performed by the coprocessors are publicly verifiable. Coprocessors can be vertically and horizontally scaled based on throughput requirements of the various confidential dapps.

Key Management Service (KMS): a set of nodes running various Multi-Party Computation (MPC) protocols for key generation, CRS generation and threshold decryption. The KMS ensures that no single party can ever access the decryption keys. KMS nodes are orchestrated by the Gateway, ensuring all operations are publicly visible. Furthermore, all KMS nodes must run the MPC software inside AWS Nitro Enclaves, making it harder for operators to leak their shares while providing some level of integrity on the MPC computation. Eventually, our goal will be to use ZK-MPC to enable verifiability without hardware assumptions.

Operators: a set of entities that run the Zama Protocol nodes. This includes Coprocessors and KMS nodes.

The following diagram shows the lifecycle of a confidential token transfer across the various components.

Performance

The Zama Protocol is designed to be horizontally scalable, leveraging our cutting-edge TFHE-rs library. Contrary to the sequential behavior of the EVM, the Zama Protocol parallelizes the computation of FHE operations. As long as a specific ciphertext isn’t used in a sequential chain of FHE operations, Coprocessors will be able to increase the throughput simply by adding more servers.

Since we started working on the Zama Protocol, we have been able to increase throughput exponentially from 0.2 transactions per second to over 20 transactions per second on CPU, enough to make all of Ethereum encrypted. 

By the end of 2026, we will migrate to GPUs, with an expected 500-1000 TPS per chain, enough to cover all L2s and most Solana use cases. 

Finally, we are working on a dedicated hardware accelerator (ASIC) for FHE, which will enable 100,000+ tps / chain on a single server, enough to bring global payments confidentially onchain.

The important point here is that FHE is no longer limited by underlying algorithms, and is now mostly driven by Moore’s law: the better the hardware, the better the throughput of the Zama Protocol.

Security

The Zama Protocol uses a defense-in-depth approach, combining multiple techniques to ensure maximum security:

We use 128 bits of security and a p-fail of 2^-128 for all FHE operations. This is far more than any other FHE scheme used in blockchain currently. Furthermore, our FHE scheme is post-quantum, meaning it is secure even against quantum computers.

All the FHE operations are publicly verifiable, allowing anyone to recompute the result and identify malicious FHE nodes. This is akin to optimistic rollup security, but for FHE computation. Furthermore, we don’t run a single FHE node, but rather have 3 operators run FHE nodes and sign their outputs, allowing to have both optimistic security and consensus on the result.

We use 13 nodes with a 2/3 majority rule for all our MPC protocols, while most other projects only use 3 to 5 nodes. Furthermore, our MPC protocol is robust, meaning it will give a correct output with up to 1/3 malicious nodes. As far as we know, this is the first implementation in production of a robust MPC protocol.

Additionally, our MPC protocol runs inside AWS Nitro Enclaves, adding a layer of defense in depth and preventing access to the underlying share of the FHE private key from outside the protocol. The enclave also offers an attestation of the software version the MPC nodes are running, allowing the protocol to keep track of software updates. The combination of MPC and Nitro enclaves means recovering the shares and using them outside of the protocol would require AWS and multiple MPC nodes to collude.

Genesis operators are highly reputable organizations with billions at stake through their non-Zama activities, whether as professional validators, infrastructure providers, businesses, or other. As they are all doxxed, anyone can see if they misbehaved. This brings economic security beyond their on-chain stake, as being caught misbehaving in the Zama Protocol will likely impact their other activities.

Slashing is done via governance, allowing anyone to suggest a recourse if they identify bad behavior in an operator. This offers greater flexibility by allowing to capture edge cases and treat issues on a case per case basis.

The Zama Protocol is being audited by Trail of Bits and Zenith. This is one of the largest audits of a crypto protocol, with over 34 audit-weeks spent on it so far.

Compliance

Building confidential applications often requires complying with local regulations. For example, financial institutions need to know who their customers are, verify that they are eligible to access specific financial instruments, that they are not blacklisted etc. Similarly, token issuers could give themselves the right to see the balances and transactions of their users, and comply offchain with existing AML / compliance tools used by traditional finance today.

Contrary to many blockchain confidentiality protocols that puts the burden of compliance on the end-users, the Zama Protocol enables applications to define their own compliance rules directly within their smart contracts.

The ability to have “programmable compliance” is a key advantage offered by FHE, and means that the protocol itself has no say on who can access which encrypted value. Developers decide what is best for their applications, not the Zama Protocol.

Future Improvements

The Zama Protocol is the most advanced confidentiality protocol to date, and can already scale to address most blockchain use cases. Nonetheless, there are several areas of improvements we are working on to make it even more decentralized, secure and scalable. These typically rely on a combination of better hardware, better algorithms, and ZK-ifying everything:

Reaching 100k tps

New FHE techniques: we are constantly inventing new FHE techniques that improve performance. We expect the base algorithms to improve by 10-20x over the coming years, similar to the performance gains ZK had in the past few years.

FHE ASICs: we are working with several companies on accelerating FHE with dedicated hardware. The goal is to make FHE 100x-1000x faster using ASICs, in the same way Bitcoin mining or AI has been improved with dedicated hardware. We expect the first accelerators to be available in 2027-2028.

ZK-rollup Gateway: the Gateway currently uses an optimistic rollup. Our goal is to move to a ZK rollup and improve the performance to support tens of thousands of transactions per second with a latency of less than 100ms.

Making the KMS even more bullet-proof

ZK-MPC: currently, all MPC protocols require a majority assumption on the nodes running the protocol. While this is fine in practice, in theory it enables MPC nodes to collude and provide an incorrect result. Our current design relies of AWS Nitro Enclaves to ensures the MPC nodes run the correct software, but this makes verifiability dependent on hardware security, which is suboptimal. To address this, we are working on adding ZK proofs to the MPC protocols, allowing anyone to verify that the individual contributions of MPC nodes are correct.

Large MPC committees: MPC doesn’t scale well: the more parties are involved, the slower it gets. As a result, most MPC protocols run with less than 10 nodes. While the Zama Protocol already uses more (13 nodes), it would be preferable to increase that number to a hundred, ensuring even more robustness and decentralization.

Enabling anyone to be an operator

Running MPC inside HSMs: a major issue with MPC protocols is the need to trust the nodes with not leaking their share of the private key. This is typically done by using TEEs and a trusted committee of nodes. However this does not enable permissionless participation, as malicious attackers could try to break the TEE and access the secret in it. As an alternative, we are exploring how to run MPC inside HSMs such as those used by banks and other critical infrastructure.

ZK-FHE: by proving the correctness of the FHE computation, it becomes possible to replace the Coprocessor consensus by a Proof-of-Work style protocol where anyone can compete to execute FHE operations, as long as they provide a proof that the result is correct. Right now, the overhead of ZK on top of the overhead of FHE makes this impractical, but our team is making good progress.

Making the protocol fully post-quantum

Post-quantum ZKPoK: Zama’s FHE and MPC technologies are already resistant to quantum computers. However, the ZKPoK is not (similar to most ZK-SNARKs). We are working on replacing it with a lattice-based ZK scheme that is post-quantum.

Post-quantum signatures: while we can make the Zama Protocol components post-quantum, signature schemes used by Host Chains are not currently post-quantum. We unfortunately do not have control over this, as it is up to the Ethereum, Solana and other L1/L2s communities to migrate to post-quantum signatures.

Operations and governance

The Zama Protocol uses Delegated Proof-of-Stake, with 18 operators running the protocol: initially 13 KMS nodes and 5 FHE Coprocessors (then more over time). They are chosen according to the following rules:

genesis operators are selected based on reputation, DevOps experience and offchain value (equity, revenue, market cap, …). This enables bootstrapping security via reputation, as an operator with a large business value will likely lose customers if they get caught misbehaving in the Zama Protocol.

we will progressively allow anyone to become a KMS or Coprocessor operator. To do so, they will first need to demonstrate they can reliably run a node in testnet, then stake at least 0.5% of the circulating $ZAMA supply. Every epoch (eg 3 months), the top KMS and Coprocessor operators by stake are selected to run the protocol for the next epoch.

the active operators earn staking rewards in $ZAMA tokens, based on their role and stake.

Token holders with limited infrastructure capabilities that would not qualify to be an operator can still participate in securing the protocol and earning rewards by delegating their $ZAMA tokens to the whitelisted operators. It is up to each operator to decide how to incentivize their delegators, whether through lower commissions or additional non-$ZAMA rewards.

Updates to the Zama Protocol have to be adopted by a majority of operators to be effective. This includes software updates, changes to the fees, adding support for a new Host Chain, etc. The only exception is pausing the protocol in case of an emergency and blacklisting spammers, which any operator can do (however unpausing / de-blacklisting requires multiple coprocessors to be involved). In case of abuse, operators can get slashed. This ensures that the Zama Protocol has a swift mechanism to address critical issues, while incentivizing operators to behave honestly.

The $ZAMA token

The $ZAMA token is the native token of the Zama Protocol. It is used for protocol fees and staking. It follows a burn and mint model, where 100% of the fees are burnt and tokens are minted to reward operators.

Fee model

Deploying a confidential app on a supported chain is free and permissionless. Furthermore, the Zama Protocol does not charge for the FHE computation, instead charging for:

Verifying ZKPoKs. Each time a user includes encrypted inputs in a transaction, they need to pay a fee to the Zama Protocol to verify it. 

Decrypting ciphertexts. When a user wants to decrypt a ciphertext, they need to pay a fee to the Zama Protocol. 

Bridging ciphertexts. When a user wants to bridge an encrypted value from one chain to another, it needs to request it from the Zama Protocol and pay a fee.

The protocol fees can be paid by the end user, the frontend app or a relayer. As such, developers can create applications without their users ever needing to hold $ZAMA tokens directly.

Protocol fees are paid with $ZAMA tokens, but are priced in USD. A price oracle regularly updates the $ZAMA/USD price on the Gateway, which updates the number of $ZAMA tokens paid for each protocol functionality. This has several advantages:

it ensures protocol fees are proportional to usage and not dependent on speculation

it creates predictability for users, developers and relayers, which can model their costs in USD rather than potentially volatile tokens.

Additionally, the Zama Protocol uses a volume-based fee model: the more someone uses the protocol, the less fees they pay per operation. The smart contracts on the Gateway keep track of the number of bits each address has verified/decrypted/bridged over the last 30 days, and applies a discount based on volume. 

The initial fee structure is as follows. It can be changed via social consensus based on network performance, operating costs or other reasons put forward by token holders:

ZKPoK verification: from $0.5 to $0.005

Bridging: from $1 to $0.01

Decryption: from $0.1 to $0.001

Taking a confidential token transfer as an example:

amounts and balances are encrypted

there is typically 3 decryptions per transaction, one for each of the sender and receiver balances, and one for the final amount transferred, which will be set to 0 if the transfer failed.

as such, the total cost would be, depending on the discount:

ZKPoK verification of encrypted amount: [$0.005 - $0.5]

Decryption of 2 balances + amount: 3 * [$0.001 - $0.1] = [$0.003 - $0.3]

Total cost: $0.008 to $0.8

This model is designed to be affordable for large users and profitable for operators, regardless of market condition and price volatility. Eg a user interacting just once a month with confidential apps would pay less than 1$ / transaction, while a user interacting with a high-volume app such as a confidential stablecoin payment app or a wallet would pay less than 1 cent / transaction.

With this fee structure, each 3 tps on a host chain generates on average $1m in fees yearly on the Zama Protocol. Considering the growth of stablecoin payments and onchain finance, we can expect over 100k transactions per second globally in the near future. If 10% of those transactions use Zama for confidentiality, it would generate $3b in fees / year for the protocol.

Staking rewards

Operators need to stake $ZAMA tokens to participate in running the protocol and receive the associated staking rewards. Tokens distributed as staking rewards are minted according to an inflation rate (10% initially, then decreasing over time), which can be changed via governance.

When rewards are distributed, they are first split by role (sequencer, coprocessors, KMS nodes), then distributed pro-rata of the square root of the stake of each operator within that group. Each operator then decides how they want to split their rewards with their delegators (we anticipate they will take ~20% commission).

Distributing rewards this way ensures that each operator gets rewarded according to the job they did, while avoiding concentration of rewards into a few operators only. 

The table below summarizes the percentage of rewards going to each group, and the expected operator infra costs:

Role
% of rewards / operator
Number of operators
Monthly infra cost / operator

Coprocessors

8%

5

$15,000 / 10 tps on host chains

KMS

4.6%

13

$5,000 / 50 tps decryptions

Distribution

More information coming soon—Follow Zama on X to get latest updates.

About Zama, the company

The Zama Protocol is a spinout from Zama, an open source cryptography company building state-of-the-art Fully Homomorphic Encryption (FHE) solutions for blockchain and AI.

Zama has raised over $150m at a $1b valuation from some of the most successful blockchain investors, including Multicoin, Pantera, Blockchange and Protocol Labs, as well as founders of major protocols such as Juan Benet (IPFS/Filecoin), Gavin Wood (Ethereum/Polkadot), Anatoly Yakovenko (Solana), Sandeep Nailwal (Polygon), and others.

Team

Zama is a cryptography company operating across the globe. It was founded in 2020 by Dr Rand Hindi (CEO) and Dr Pascal Paillier (CTO), with other prominent researchers leading the company, such as Prof Nigel Smart (Chief Academic Officer) and Dr Marc Joye (Chief Scientist). There are more than 90 people working at Zama, of which nearly half hold PhDs, making Zama the largest research team in FHE.

About the founders:

Rand is an entrepreneur and deeptech investor. He is the CEO at Zama and a partner at Unit.vc, where he invested in over 100+ companies across cryptography, AI and biotech. Rand is also a competitive biohacker, and currently ranks in the top 5% of the Rejuvenation Olympics with an aging rate of 0.68. Rand started coding at the age of 10, founded a Social Network at 14 and started his PhD when he was 21. He then created Snips, a confidential AI startup that was acquired by Sonos. He was previously a member of the French Digital Council, advising the government on AI and Privacy issues, a lecturer at Science Po University in Paris, and an advisor to several biotech, AI and defense companies. He holds a BSc in Computer Science and a PhD in Bioinformatics from University College London (UCL).

Pascal is a pioneer in FHE and cryptography, and the CTO at Zama. He invented one of the first additive homomorphic scheme (the Paillier encryption scheme), which is still widely used today. Pascal has published dozens of papers, with major contributions across various cryptography domains, including FHE, smart cards, and more. Prior to Zama, he led the cryptography innovation team at Gemalto, and founded CryptoExperts a leading cryptography consulting firm. Pascal is a 2025 IACR fellow, received several awards for his research, and led multiple ISO standards for cryptography. He holds a PhD in cryptography from Telecom Paris.

Products & Services

Everything we do is open source under a dual licensing model. It is free for non-commercial use, prototyping, research and personal projects, but commercial use requires either obtaining an enterprise license or building on top of a protocol that already has one.

Developers building on the Zama Protocol don’t need an extra license. However, forking, copying or using Zama’s technology outside of the Zama Protocol does require a license.

We offer several products and services:

FHE libraries for AI and blockchain. This includes TFHE-rs, FHEVM, Concrete ML, and TKMS. They are free for non-commercial use, but require an enterprise license for commercial use.

Hosted services, such as an encryption/decryption relayer and a decryption oracle, that make it easy for app developers to use the Zama Confidential Blockchain Protocol and other protocols based on our FHEVM technology.

Premium support for companies and developers who need help building and managing their FHE applications.

There are over 5,000+ developers using our libraries, representing a 70% market share. Our technology has furthermore been licensed to dozens of companies, including L1s, L2s, finance and AI. Nearly all decentralized protocols using FHE are using Zama’s technology behind the scene.

Note that the Zama Protocol is operated as an independent, decentralized protocol. The services we offer on the company side are independent of the protocol itself, and are meant to serve enterprises and developers who want to build confidential applications, regardless of whether they are deployed on the Zama Protocol or not.

Additional links

Zama Protocol docs

FHEVM whitepaper

TFHE-rs handbook

MPC protocol spec (coming soon)

Audit report (coming soon)

Zama GitHub

Discord

X

Zama blog

Disclaimer

The present light paper and/or any other accompanying documentation ("Document”) only provide educational material about the Zama Protocol and the $ZAMA token. Please note that the Zama Protocol and the $ZAMA token are under active development and are subject to change. Zama may change this Document at any time at its sole discretion without notice.

Any documentation is provided for informational purposes only and does not constitute some kind of prospectus, key information document, or similar document. No prospectus, key information document, or similar document will be provided at any time. There is no guarantee for the completeness of the documentation provided. All numbers and forward-looking statements mentioned within the present document as well as any accompanying documentation reflect mere estimations/indications. They are not guaranteed and may change substantially.

Any and all liability of ZAMA Switzerland AG and/or any affiliated legal entity or private individual for the completeness and accuracy of the documentation provided and any damages arising from reliance on such documentation is limited to the fullest extent permitted by any applicable law.

Any dispute related to or arising out of the information provided within the present Document as well as any accompanying documentation shall be submitted to the exclusive jurisdiction of the competent courts of Zug, Switzerland, with the exclusion of any other jurisdiction or arbitration.

This disclaimer, the Document, as well as any accompanying documentation shall be governed by and construed and interpreted in accordance with the substantive laws of Switzerland, excluding the Swiss conflict of law rules.

Last updated 27 days ago

---

