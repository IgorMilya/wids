# Wireless Intrusion Detection System

## 📌 Project Description
**WIPS** is a feature-rich desktop application framework that leverages React, Tauri, and Rust to deliver powerful Wi-Fi management and security tools. Designed for developers, it simplifies building cross-platform, secure desktop apps with a modern user interface. The core features include:
- 🧩**Modular Architecture:** Organized codebase with clear separation of frontend, backend, and system integrations.
- 🔒**Wi-Fi Security & Monitoring:** Scan networks, detect evil twins, assess risks, and manage blacklists and whitelists.
- 🎨**Rich UI Components:** Customizable tables, modals, navigation, and risk indicators for intuitive data visualization.
- ⚙️**System Integration:** Seamless control over Wi-Fi connections, network info retrieval, and system commands.
- 🚀**Scalable Development:** State management with Redux, API layer, and TypeScript configurations for maintainability.

## Getting Started
To use WIPS, you just need to install the newest release in the **Releases** section and install the wips-ui.exe file. After that, you can double-click on this file and WIPS will be opened.
If you want to install the whole project, let's go to the **Installation** section.

### Prerequirements
This project requires the following dependencies:
- **Package Manager:** Npm, Cargo
- **Programming Language:** TypeScript

### Installation
To install WIPS, follow these steps:

1. **Clone the repository**  
   ```bash
   git clone https://github.com/IgorMilya/wips.git
   ```
2. **Navigate to the project directory for UI**  
   ```bash
   cd wips
   ```
3. **Install dependencies from package.json**  
   ```bash
   npm install
   ```
3. **Navigate to the Rust functional folder and install all dependencies from Cargo.toml **  
   ```bash
   cd src-tauri
   cargo build
   ```
4. **Set local enviroment**
   This application uses env VITE_API_BASE_URL for security reasons. Before running, you need to create in the root directory .env file and specify the VITE_API_BASE_URL environment variable. This VITE_API_BASE_URL is your server API that will communicate with MongoDB. For local developments, use http://localhost:3000 value to specify VITE_API_BASE_URL.
   You need to install wips server as well, [wisp-server](https://github.com/IgorMilya/wisp-server.git). All necessary requirements regarding the wisp-server will be on that repository
   
### Usage
To start the WIPS application, run the following command in the root directory **wips**:
   ```bash
   npm run dev
   ```
This will start a local [http://localhost:1420/](http://localhost:1420/) and after launch the desktop application.
It will automatically run 2 commands such as: "npm run start-client" and "npm run start-server". First command "npm run start-client" launches the command "vite" and the second "npm run start-server" launches "cd src-tauri && cargo run" for Rust functionalities. 
Moreover, you need to install wips server as well, [wisp-server](https://github.com/IgorMilya/wisp-server.git). All necessary requirements regarding the wisp-server will be on that repository

## Main Functionalities:
- Scan networks
- Connect to the network
- Disconnect
- Add/Delete Blacklist/Whitelist

## User Guidelines
Open wips-ui.exe and navigate to the Scanner page

![image](https://github.com/user-attachments/assets/9cf4f2ad-5ac2-47b1-800e-43892f53a4ff)

There, you can see your active network if you have a connection to wi-fi

![image](https://github.com/user-attachments/assets/32f34a2c-9ffa-4c73-a45a-732344836a49)

and the scan button. 

Then you can click on the scan button and see all the nearest networks:
![image](https://github.com/user-attachments/assets/01efe6ce-417c-44bc-ad48-70ba904d0b24)
By selecting one special network, you can connect to it, blacklist, or whitelist this network. If you Blacklist this network, this network will never appear on your scan results and will be in Blacklist page. If you Whitelist the network, you will not be able to blacklist and whitelist again and risk will change on WL (Whitelist) 
![image](https://github.com/user-attachments/assets/44de9866-e1d7-43b2-bf5d-4ce4ec4cd3be)
Connection to the network takes 5-15 seconds, depending on whether it is a known network and you don't need to enter a password, or an unknown network and you need to enter a password to connect.
