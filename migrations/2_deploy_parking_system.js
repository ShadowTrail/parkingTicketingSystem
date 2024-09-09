const ParkingSystem = artifacts.require("ParkingSystem");

module.exports = function (deployer) {
  // Specified an initial hourly rate here
  const initialHourlyRate = 2; // Adjust this value as needed

  // Deployed the ParkingSystem contract with the specified initial hourly rate
  deployer.deploy(ParkingSystem, initialHourlyRate);
};
