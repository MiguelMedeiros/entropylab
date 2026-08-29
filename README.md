# EntropyLab

> See entropy become a Bitcoin wallet — visibly, deterministically, and offline.

![EntropyLab interface presented in a dark, security-focused workspace](assets/readme-hero.jpg)

[Open the live UX preview](https://miguelmedeiros.github.io/entropylab/) · [Official site](https://entropylab.online) · [Download a release](https://github.com/w-s-bitcoin/entropylab/releases) · [Read the documentation](DOCUMENTATION.md) · [Security](SECURITY.md)

EntropyLab is a self-contained Bitcoin key and wallet calculator for offline,
air-gapped use. Bring your own dice rolls, coin flips, cards, entropy, seed
phrase, or private key; the application keeps every sensitive calculation on
the device and never generates wallet entropy for you.

Current version: **v0.1.3**

## Why EntropyLab

- One downloadable `entropylab.html` file with no runtime dependencies.
- BIP39, BIP32, single-signature, multisignature, descriptors, PSBT inspection,
  recovery sheets, LifeHash fingerprints, and Bitcoin Core `wallet.dat` export.
- Mainnet and Testnet support across legacy, nested SegWit, native SegWit, and
  Taproot wallets.
- Dark, light, and system appearance modes, four color palettes, responsive
  controls, presentation privacy, and nine offline interface languages.

## Use it safely

The hosted site is convenient for exploration and test vectors. For funded
wallets, download the HTML, verify it, move it to a trusted air-gapped computer,
and confirm important addresses with an independent wallet or signing device.

```sh
sha256sum -c SHA256SUMS.txt
gh attestation verify entropylab.html -R w-s-bitcoin/entropylab
```

The checksum detects corruption; the GitHub artifact attestation authenticates
the build. Never enter funded seed phrases or private keys on an online device.

## Build locally

Requires Node.js 20.19 or newer.

```sh
npm ci
npm run build
npm test
```

The result is the single self-contained `entropylab.html` application. See the
[complete documentation](DOCUMENTATION.md) for supported inputs, wallet flows,
verification details, architecture, WASM build, testing, and deployment.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) before proposing a change. EntropyLab is
deliberately small and auditable: no generated wallet entropy, no network
egress, and no unreviewed dependencies.

Released into the public domain under [The Ooga Booga License](LICENSE).
