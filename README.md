# PLC Connector


PLC Connector is a JavaScript desktop application that allows communication between a PLC and Firebase. With this tool, it is possible to send and receive information from the PLC to Firebase and vice versa in an easy and fast way.

## Features:

 - Connection with the PLC using Modbus TCP protocol
 - Real-time sending of PLC data to Firebase
 - Reading Firebase data and displaying it on a dashboard in the application
 - Possibility of remotely controlling devices through Firebase

## Requirements:

 - Node.js
 - Being on the same network as a Siemens PLC

## Installation

To use the PLC Connector, you need to have Node.js installed on your computer. After installing Node.js, follow these steps:

 - Clone this repository to your computer
 - In the terminal, navigate to the repository directory and run the command ```npm install``` to install the necessary dependencies
 - Configure the Firebase credentials in the "fb.js" file
 - Run the command ```npm start``` to start the application

## Usage

When you open the PLC Connector, you will see a screen with some fields, fill them with the IP address of the PLC, the slot, and the rack, and then click "Connect".

You can register the tags you want to observe or modify by filling out the "New tag" form with the type, format, and address of the tag, and then click "Save". On the right side of the screen, you can see the list of registered tags and their values.

When registering a new tag or changing the value of an existing one, the information will be sent to the PLC and Firebase. If any tag is changed by the PLC, the PLC Connector will detect this change and send it to Firebase. Similarly, if any changes are detected in the Firebase data, the tag in the PLC will have its value updated.

## Notes:

- It is important to ensure that the computer's firewall allows communication with the PLC and Firebase.
- GET and PUT settings must be enabled on the PLC.


---

This project was developed for the Final Course Work entitled "BIDIRECTIONAL COMMUNICATION BETWEEN PLC AND MOBILE APPLICATION FOR INDUSTRIAL PROCESS AUTOMATION" in the Control and Automation Engineering course at the Federal University of Pernambuco.