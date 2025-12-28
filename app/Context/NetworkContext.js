"use client";

import { createContext, useContext, useState, useEffect } from "react";

const NetworkContext = createContext();

export function NetworkProvider({ children }) {
  const [network, setNetwork] = useState("devnet"); // Default: devnet

  // Load saved network from localStorage on mount
  useEffect(() => {
    const savedNetwork = localStorage.getItem("selectedNetwork");
    if (savedNetwork && ["devnet", "mainnet"].includes(savedNetwork)) {
      setNetwork(savedNetwork);
    }
  }, []);

  // Available networks with name, RPC URL, and display label
  const networks = {
    devnet: {
      name: "devnet",
      label: "Devnet",
      rpc: "https://kirstyn-7fsg6s-fast-devnet.helius-rpc.com",
      description: "Test Network",
      color: "blue",
    },
    mainnet: {
      name: "mainnet",
      label: "Mainnet",
      rpc: "https://rosemaria-weqok5-fast-mainnet.helius-rpc.com",
      description: "Live Network (Real SOL)",
      color: "red",
    },
  };

  const changeNetwork = (net) => {
    if (networks[net]) {
      localStorage.setItem("selectedNetwork", net);
      setNetwork(net);
    }
  };

  const currentNetwork = networks[network];

  return (
    <NetworkContext.Provider
      value={{
        network, // e.g., "devnet"
        currentNetwork, // full object with label, rpc, etc.
        networks, // all available networks
        changeNetwork,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error("useNetwork must be used within a NetworkProvider");
  }
  return context;
}
