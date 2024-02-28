/// <reference types="@vechain/connex" />
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { DAppKitProvider } from "@vechain/dapp-kit-react";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <DAppKitProvider
      nodeUrl={"https://testnet.vechain.org"}
      genesis={"test"}
      usePersistence={true}
    >
      <App />
    </DAppKitProvider>
  </React.StrictMode>,
);
