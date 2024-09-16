// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ParkingSystem {
    
    enum VehicleType { Bike, Car, Truck }
    enum LaneType { Normal, Fastlane }

    struct Slot {
        uint availableSlots;
        uint pricePerHour;  //in wei
    }

    struct Entry {
        VehicleType vehicleType;
        LaneType laneType;
        uint entryTime;
        bool isParked;
    }

    // Owner of the contract (parking system)
    address public owner;

    // Parking slots by vehicle type and lane type
    mapping(VehicleType => mapping(LaneType => Slot)) public parkingSlots;

    // Map vehicle addresses to their entries
    mapping(address => Entry) public vehicleEntries;

    // Track the wallet address that is currently parked
    mapping(address => bool) public hasParked;

    constructor() {
        // Set contract owner
        owner = msg.sender;
        
        // Initialize parking slots 
        parkingSlots[VehicleType.Bike][LaneType.Normal] = Slot(10, 1 ether);
        parkingSlots[VehicleType.Bike][LaneType.Fastlane] = Slot(5, 2 ether);

        parkingSlots[VehicleType.Car][LaneType.Normal] = Slot(20, 2 ether);
        parkingSlots[VehicleType.Car][LaneType.Fastlane] = Slot(10, 4 ether);

        parkingSlots[VehicleType.Truck][LaneType.Normal] = Slot(5, 5 ether);
        parkingSlots[VehicleType.Truck][LaneType.Fastlane] = Slot(2, 10 ether);
    }

    // View available slots for a vehicle type and lane
    function viewAvailableSlots(VehicleType _vehicleType, LaneType _laneType) public view returns (uint) {
        return parkingSlots[_vehicleType][_laneType].availableSlots;
    }

    // Vehicle entry
    function enterParking(VehicleType _vehicleType, LaneType _laneType) public {
        require(!hasParked[msg.sender], "You are already parked.");
        require(parkingSlots[_vehicleType][_laneType].availableSlots > 0, "No available slots for this vehicle type and lane.");

        vehicleEntries[msg.sender] = Entry({
            vehicleType: _vehicleType,
            laneType: _laneType,
            entryTime: block.timestamp,
            isParked: true
        });

        hasParked[msg.sender] = true; // Mark the wallet as having parked

        // Update available slots
        parkingSlots[_vehicleType][_laneType].availableSlots -= 1;
    }

    // Vehicle exit and payment
    function exitParking() public payable {
        require(vehicleEntries[msg.sender].isParked, "Vehicle is not parked.");
        
        Entry memory entryDetails = vehicleEntries[msg.sender];
        uint parkingDuration = block.timestamp - entryDetails.entryTime;
        uint hoursParked = parkingDuration / 3600 + 1;  // Charge per hour, minimum 1 hour

        uint charge = hoursParked * parkingSlots[entryDetails.vehicleType][entryDetails.laneType].pricePerHour;

        require(msg.value >= charge, "Insufficient funds to pay for parking.");

        // Transfer payment to the parking owner
        payable(owner).transfer(charge);

        // Refund if overpaid
        if (msg.value > charge) {
            payable(msg.sender).transfer(msg.value - charge);
        }

        // Update available slots
        parkingSlots[entryDetails.vehicleType][entryDetails.laneType].availableSlots += 1;

        // Remove vehicle entry
        delete vehicleEntries[msg.sender];
        hasParked[msg.sender] = false; // Mark the wallet as not having parked
    }
}
