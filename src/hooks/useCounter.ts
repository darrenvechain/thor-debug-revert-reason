import { useConnex } from "@vechain/dapp-kit-react";
import { useEffect, useState } from "react";

import { abi } from "thor-devkit";

const counter: abi.Function.Definition = {
  inputs: [],
  name: "counter",
  outputs: [
    {
      internalType: "uint256",
      name: "",
      type: "uint256",
    },
  ],
  stateMutability: "view",
  type: "function",
};

const increment: abi.Function.Definition = {
  inputs: [],
  name: "increment",
  outputs: [],
  stateMutability: "nonpayable",
  type: "function",
};

type Status =
  | "Waiting for wallet"
  | "Pending Transaction"
  | "Transaction Success"
  | "Error (See Console)";

export const useCounter = () => {
  const connex = useConnex();

  const contract = connex.thor.account(
    "0x8384738c995d49c5b692560ae688fc8b51af1059",
  );

  const [count, setCount] = useState<number>();
  const [status, setStatus] = useState<Status | undefined>(undefined);

  const getCount = async () => {
    const result = await contract.method(counter).call();
    setCount(result.decoded[0]);
  };

  const incrementCount = async () => {
    setStatus(undefined);

    try {
      const tx = contract
        .method(increment)
        .transact()
        .delegate("https://sponsor-testnet.vechain.energy/by/90")
        .request();

      setStatus("Waiting for wallet");

      const res = await tx;
      console.log(res);

      setStatus("Pending Transaction");

      await connex.thor.ticker().next();

      const receipt = await connex.thor.transaction(res.txid).getReceipt();

      if (!receipt || receipt.reverted) {
        console.log(receipt);
        setStatus("Error (See Console)");
      } else {
        await getCount();
        setStatus("Transaction Success");
      }
    } catch (error) {
      console.log(error);
      setStatus("Error (See Console)");
    }
  };

  useEffect(() => {
    getCount();
  }, []);

  return {
    status,
    count,
    incrementCount,
  };
};
