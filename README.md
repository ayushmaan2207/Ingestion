# Bidirectional ClickHouse & Flat File Data Ingestion Tool

A web-based integration tool that enables seamless bidirectional data transfer between a ClickHouse database and flat files (CSV format). Designed with flexibility and usability in mind, this tool supports JWT-based ClickHouse authentication, column selection, and efficient ingestion reporting via an intuitive React + Node.js interface.

---

## Features

-  **Bidirectional Ingestion**:  
  - ClickHouse ➝ Flat File  
  - Flat File ➝ ClickHouse  

-  **ClickHouse Authentication via JWT**

-  **Schema Discovery & Column Selection**

-  **Data Preview (first 100 records)**

-  **Record Count Reporting**

-  **Error Handling & User Feedback**


## Tech Stack

- **Frontend**: React + Tailwind CSS  
- **Backend**: Node.js (Express)  
- **Database**: ClickHouse


### Setup

- # Clone the repository
```bash
git clone https://github.com/ayushmaan2207/Ingestion.git
```

- # Install backend dependencies
```bash
cd server
npm install
```
- # Install frontend dependencies
```bash
cd ../client
npm install
```
