import { generateMnemonic, mnemonicToSeed } from "bip39";
import { pki, random } from "node-forge";
import generateKeyPair from "util/generateKeypair";

jest.setTimeout(1000000)

describe("Deterministic key generation", () => {

    const mnemonic = generateMnemonic(256)

    it("should generate RSA pairs deterministically from mnemonic", async () => {
        const seed = (await mnemonicToSeed(mnemonic)).toString('hex')

        const prng = random.createInstance();
        prng.seedFileSync = () => seed

        const keys = Array(2).fill(
            pki.publicKeyToPem(
                (await generateKeyPair(mnemonic)).publicKey
            )
        )

        expect(keys[0]).toEqual(keys[1])

    })
})