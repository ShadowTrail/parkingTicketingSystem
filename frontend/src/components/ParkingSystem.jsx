import React, { useEffect, useState } from "react";
import Web3 from "web3";
import ParkingSystemABI from "../contracts/ParkingSystem.json"; // Import ABI

const ParkingSystem = () => {
  const [account, setAccount] = useState("");
  const [parkingContract, setParkingContract] = useState(null);
  const [vehicleType, setVehicleType] = useState("0"); // Default: Bike
  const [laneType, setLaneType] = useState("0"); // Default: Normal
  const [slots, setSlots] = useState(0); // Initial slots available
  const [isParked, setIsParked] = useState(false);
  const [entryTime, setEntryTime] = useState(null); // Track entry time
  const [calculatedFee, setCalculatedFee] = useState("0");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadWeb3();
  }, []);

  const loadWeb3 = async () => {
    if (window.ethereum) {
      const web3 = new Web3(window.ethereum);
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const accounts = await web3.eth.getAccounts();
      setAccount(accounts[0]);

      loadBlockchainData(web3);
    } else {
      setErrorMessage("Please install MetaMask to use this app.");
    }
  };

  const loadBlockchainData = async (web3) => {
    const networkId = await web3.eth.net.getId();
    const deployedNetwork = ParkingSystemABI.networks[networkId];
    if (deployedNetwork) {
      const contract = new web3.eth.Contract(
        ParkingSystemABI.abi,
        deployedNetwork.address
      );
      setParkingContract(contract);
    } else {
      setErrorMessage("Smart contract not deployed to the detected network.");
    }
  };

  const viewAvailableSlots = async () => {
    if (parkingContract) {
      try {
        const slots = await parkingContract.methods
          .viewAvailableSlots(vehicleType, laneType)
          .call();
        setSlots(slots);
        console.log(slots);
      } catch (error) {
        setErrorMessage("Error fetching available slots: " + error.message);
        console.log(error);
      }
    }
  };

  const enterParking = async () => {
    if (parkingContract && account) {
      try {
        // Check if the user is already parked
        const hasParked = await parkingContract.methods
          .hasParked(account)
          .call();
        if (hasParked) {
          setErrorMessage(
            "You are already parked. Please exit before parking another vehicle."
          );
          return;
        }

        await parkingContract.methods
          .enterParking(vehicleType, laneType)
          .send({ from: account });
        const timeNow = Math.floor(Date.now() / 1000); // Current timestamp in seconds
        setEntryTime(timeNow); // Store entry time
        setIsParked(true);
      } catch (error) {
        setErrorMessage(error.message);
      }
    }
  };


  const calculateParkingFee = async () => {
    if (!entryTime) return; // Do nothing if no entry time

    try {
      const currentTime = Math.floor(Date.now() / 1000); // Current timestamp
      const timeSpent = currentTime - entryTime; // Time spent in seconds
      const hoursSpent = Math.ceil(timeSpent / 3600); // Round up to the next full hour

      const rate = await parkingContract.methods
        .parkingSlots(vehicleType, laneType)
        .call();
      const ratePerHour = Web3.utils.fromWei(rate.pricePerHour, "ether"); // Convert rate from Wei to Ether
      const totalFee = hoursSpent * ratePerHour;
      setCalculatedFee(totalFee.toString());
      console.log(totalFee);
    } catch (error) {
      setErrorMessage("Error calculating parking fee: " + error.message);
    }
  };
  const calculateFee = async () => {
    if (parkingContract && account) {
      try {
        await calculateParkingFee();
      } catch(error){
        console.log(error)
      }
    }
  }
  const exitParking = async () => {
    if (parkingContract && account) {
      try {
        await calculateParkingFee();
        const feeInWei = Web3.utils.toWei(calculatedFee, "ether");

        await parkingContract.methods
          .exitParking()
          .send({ from: account, value: feeInWei });

        setIsParked(false);
        setEntryTime(null); // Reset entry time after exiting
        setCalculatedFee("0"); // Reset calculated fee
      } catch (error) {
        setErrorMessage("Error exiting parking: " + error.message);
      }
    }
  };

  return (
    <div>
      <h1>Parking System</h1>
      <div>Connected Account: {account}</div>
      {errorMessage && <div style={{ color: "red" }}>{errorMessage}</div>}

      <div className="controls">
        <div>
          <h2>Available Slots: {slots}</h2>
          <button onClick={viewAvailableSlots}>View Available Slots</button>
        </div>

        <div>
          <h2>Enter Parking</h2>
          <label>
            Vehicle Type:
            <select
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
            >
              <option value="0">Bike</option>
              <option value="1">Car</option>
              <option value="2">Truck</option>
            </select>
          </label>
          <label>
            Lane Type:
            <select
              value={laneType}
              onChange={(e) => setLaneType(e.target.value)}
            >
              <option value="0">Normal</option>
              <option value="1">Fastlane</option>
            </select>
          </label>
          <button onClick={enterParking}>Enter Parking</button>
        </div>

        {isParked && (
          <div>
            <h2>Exit Parking</h2>
            <p>
              Total Time Parked:{" "}
              {entryTime
                ? Math.floor((Date.now() / 1000 - entryTime) / 3600)
                : 0}{" "}
              hours
            </p>
            <button onClick={calculateFee}>Calculate Fee</button>
            <p>{calculatedFee} ETH</p>
            <button onClick={exitParking}>Exit and Pay</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParkingSystem;
