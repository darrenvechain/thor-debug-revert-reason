import "./App.css";
import { useMemo, useState, useEffect } from "react";
import { DAppKit } from "@vechain/dapp-kit";
import axios from "axios";
import { abi, keccak256 } from "thor-devkit";

const mainNetUrl = "https://mainnet.vechain.org";
const testNetUrl = "https://testnet.vechain.org";

const mainnet = new DAppKit({
  nodeUrl: mainNetUrl,
  genesis: "main",
});

const testnet = new DAppKit({
  nodeUrl: testNetUrl,
  genesis: "test",
});

const errorSelector = "0x" + keccak256("Error(string)").toString("hex").slice(0, 8);
const panicSelector = "0x" + keccak256("Panic(uint256)").toString("hex").slice(0, 8);

export function decodeRevertReason(data: string): string {
  try {
    if (data.startsWith(errorSelector)) {
      return abi.decodeParameter(
        "string",
        "0x" + data.slice(errorSelector.length),
      ) as string;
    } else if (data.startsWith(panicSelector)) {
      const decoded = abi.decodeParameter(
        "uint256",
        "0x" + data.slice(panicSelector.length),
      ) as string;
      return `Panic(0x${parseInt(decoded).toString(16).padStart(2, "0")})`;
    }
    return "";
  } catch {
    return "";
  }
}

const TX_HASH_REGEX = /^0x[0-9a-fA-F]{64}$/;

function App() {
  const [txHash, setTxHash] = useState<string>(
    "0xaa5efefc055af9b80e2fa8e97f006b252f6702ea4363c67afad92004c4bbc918",
  );

  const [isTestnet, setIsTestnet] = useState<boolean>(true);
  const [revertReason, setRevertReason] = useState<string>("");

  const txHashValid = useMemo(() => {
    return TX_HASH_REGEX.test(txHash);
  }, [txHash]);

  const getDebugReason = async (
    txHash: string,
    dappKit: DAppKit,
    url: string,
  ) => {
    const tx = await dappKit.thor.transaction(txHash).get();

    if (!tx) return;

    const block = await dappKit.thor.block(tx.meta.blockID).get();

    if (!block) return;

    const txIndex = block.transactions.findIndex(
      (tx) => tx.toLocaleLowerCase() === txHash.toLowerCase(),
    );

    for (let i = 0; i < tx.clauses.length; i++) {
      const debugged = await axios.post(url + "/debug/tracers", {
        target: `${block.id}/${txIndex}/${i}`,
        name: 'call',
      });

      const revertReason = decodeRevertReason(debugged.data.output);

      if (revertReason) {
        setRevertReason(revertReason);
        return;
      }
    }
  };

  useEffect(() => {
    if (txHashValid) {
      if (isTestnet) {
        getDebugReason(txHash, testnet, testNetUrl);
      } else {
        getDebugReason(txHash, mainnet, mainNetUrl);
      }
    }
  }, [txHashValid, txHash, isTestnet]);

  const toggleNetwork = () => {
    setRevertReason("");
    setTxHash("");
    setIsTestnet((prev) => !prev);
  };

  return (
    <>
      <div className="card">
        <p>Enter TX Hash</p>
        <input
          value={txHash}
          onChange={(e) => {
            setTxHash(e.target.value);
            setRevertReason("");
          }}
        ></input>

        <p>Revert Reason:</p>
        <div>{revertReason}</div>
      </div>

      <div className="toggle">
        <label>
          Testnet
          <input type="checkbox" checked={isTestnet} onChange={toggleNetwork} />
        </label>
      </div>
      <div className="toggle">
        <label>
          Mainnet
          <input
            type="checkbox"
            checked={!isTestnet}
            onChange={toggleNetwork}
          />
        </label>
      </div>
    </>
  );
}

export default App;
