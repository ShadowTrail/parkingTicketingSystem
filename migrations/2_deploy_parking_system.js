const ParkingSystem = artifacts.require("ParkingSystem");

module.exports = function (deployer) {
  deployer.deploy(ParkingSystem);
};

