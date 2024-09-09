// src/ParkingSystem.js

import React, { useState, useEffect } from "react";
import Web3 from "web3";

// Replace with your contract's ABI and deployed address
const contractABI = [
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_hourlyRate",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "ticketId",
        type: "uint256",
      },
    ],
    name: "TicketIssued",
    type: "event",
  },
  {
    inputs: [],
    name: "hourlyRate",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
    constant: true,
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
    constant: true,
  },
  {
    inputs: [],
    name: "ticketCounter",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
    constant: true,
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "tickets",
    outputs: [
      {
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "licensePlate",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "issuedAt",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "paidAmount",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "isActive",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
    constant: true,
  },
  {
    inputs: [],
    name: "totalRevenue",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
    constant: true,
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "_licensePlate",
        type: "string",
      },
    ],
    name: "parkVehicle",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_ticketId",
        type: "uint256",
      },
    ],
    name: "unParkVehicle",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_ticketId",
        type: "uint256",
      },
    ],
    name: "payForParking",
    outputs: [],
    stateMutability: "payable",
    type: "function",
    payable: true,
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_newRate",
        type: "uint256",
      },
    ],
    name: "adjustHourlyRate",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "withdrawRevenue",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];
const contractAddress = "0x0CCD3C69f7449F0d97F2b58b89523ed5e8455a23";

const ParkingSystem = () => {
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState("");
  const [contract, setContract] = useState(null);
  const [licensePlate, setLicensePlate] = useState("");
  const [ticketId, setTicketId] = useState("");
  const [paymentTicketId, setPaymentTicketId] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Initialize web3 instance and set up the contract
    if (window.ethereum) {
      const web3Instance = new Web3(window.ethereum);
      setWeb3(web3Instance);

      // Request user's account access
      window.ethereum
        .request({ method: "eth_requestAccounts" })
        .then((accounts) => {
          setAccount(accounts[0]);
        });

      // Set up contract instance
      const parkingContract = new web3Instance.eth.Contract(
        contractABI,
        contractAddress
      );
      setContract(parkingContract);
    } else {
      alert("Please install MetaMask to use this application.");
    }
  }, []);

  const parkVehicle = async () => {
    if (contract && licensePlate) {
      try {
        const result = await contract.methods
          .parkVehicle(licensePlate)
          .send({ from: account });
        setMessage(
          `Ticket Issued with ID: ${result.events.TicketIssued.returnValues.ticketId}`
        );
      } catch (error) {
        console.error("Error while parking vehicle:", error);
        setMessage("Error while parking vehicle.");
      }
    }
  };

  const unParkVehicle = async () => {
    if (contract && ticketId) {
      try {
        await contract.methods.unParkVehicle(ticketId).send({ from: account });
        setMessage("Vehicle Unparked Successfully.");
      } catch (error) {
        console.error("Error while unparking vehicle:", error);
        setMessage("Vehicle has not been unparked yet.");
      }
    }
  };

  const payForParking = async () => {
    if (contract && paymentTicketId) {
      try {
        const amountDue = web3.utils.toWei("0.1", "ether"); // Example value
        await contract.methods
          .payForParking(paymentTicketId)
          .send({ from: account, value: amountDue });
        setMessage("Parking Fee Paid Successfully.");
      } catch (error) {
        console.error("Error while paying for parking:", error);
        setMessage("Error while paying for parking.");
      }
    }
  };

  return (
    <div>
      <h1>Parking Ticketing System</h1>
      <div>
        <input
          type="text"
          placeholder="Enter License Plate"
          value={licensePlate}
          onChange={(e) => setLicensePlate(e.target.value)}
        />
        <button onClick={parkVehicle}>Park Vehicle</button>
      </div>

      <div>
        <input
          type="text"
          placeholder="Enter Ticket ID"
          value={ticketId}
          onChange={(e) => setTicketId(e.target.value)}
        />
        <button onClick={unParkVehicle}>Unpark Vehicle</button>
      </div>

      <div>
        <input
          type="text"
          placeholder="Enter Ticket ID for Payment"
          value={paymentTicketId}
          onChange={(e) => setPaymentTicketId(e.target.value)}
        />
        <button onClick={payForParking}>Pay for Parking</button>
      </div>

      {message && <p>{message}</p>}
    </div>
  );
};

export default ParkingSystem;
