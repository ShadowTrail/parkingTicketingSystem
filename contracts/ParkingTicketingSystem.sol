// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Interface defining basic functions for parking management
interface IParkingManagement {
    function parkVehicle(string memory _licensePlate) external returns (uint256);
    function unParkVehicle(uint256 _ticketId) external returns (bool);
    function payForParking(uint256 _ticketId) external payable;
}

// Abstract contract to define the blueprint for a ParkingTicket
abstract contract ParkingTicket {
    struct Ticket {
        uint256 id;
        string licensePlate;
        uint256 issuedAt;
        uint256 paidAmount;
        bool isActive;
    }

    mapping(uint256 => Ticket) public tickets;
    uint256 public ticketCounter;

    function createTicket(string memory _licensePlate) internal returns (uint256) {
        ticketCounter++;
        tickets[ticketCounter] = Ticket(ticketCounter, _licensePlate, block.timestamp, 0, true);
        return ticketCounter;
    }
}

// Main contract implementing the parking management system
contract ParkingSystem is IParkingManagement, ParkingTicket {
    uint256 public hourlyRate;
    address public owner;
    uint256 public totalRevenue;

    constructor(uint256 _hourlyRate) {
        owner = msg.sender;
        hourlyRate = _hourlyRate;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can perform this action.");
        _;
    }

    // Function to park a vehicle and issue a parking ticket]
    event TicketIssued(uint256 ticketId);

    function parkVehicle(string memory _licensePlate) external override returns (uint256) {
        uint256 ticketId = createTicket(_licensePlate);
        emit TicketIssued(ticketId);
        return ticketId;
    }

    // Function to unpark a vehicle and calculate the parking fee
    function unParkVehicle(uint256 _ticketId) external override returns (bool) {
        require(tickets[_ticketId].isActive, "Ticket is not active or does not exist.");
        tickets[_ticketId].isActive = false;
        return true;
    }

    // Function to pay for parking based on time spent
    function payForParking(uint256 _ticketId) external payable override {
        Ticket storage ticket = tickets[_ticketId];
        require(ticket.isActive == false, "Vehicle must be unparked first.");
        require(ticket.paidAmount == 0, "Parking fee already paid.");
        
        uint256 timeSpent = (block.timestamp - ticket.issuedAt) / 1 hours;
        uint256 amountDue = timeSpent * hourlyRate;
        require(msg.value >= amountDue, "Insufficient payment.");

        ticket.paidAmount = msg.value;
        totalRevenue += msg.value;
    }

    // Function to adjust the hourly rate by the owner
    function adjustHourlyRate(uint256 _newRate) external onlyOwner {
        hourlyRate = _newRate;
    }

    // Function to withdraw the revenue by the owner
    function withdrawRevenue() external onlyOwner {
        payable(owner).transfer(totalRevenue);
        totalRevenue = 0;
    }
}
