# Pilotage Service Status Query

This project is a web application designed to display vessel pilotage data retrieved from an exposed API end point. The application is built using **React** with **TypeScript** and is tailored for **truck drivers** who perform last-mile delivery of shipping containers to the port berth of vessels exporting containers.

---

## Table of Contents

1. [Features](#features)
2. [Assumptions](#assumptions)
3. [Functional Requirements](#functional-requirements)
4. [Technical Details](#technical-details)
5. [Setup Instructions](#setup-instructions)
6. [Supplementary Information](#supplementary-information)

---

## Features

- **Search Bar**: Allows users to search for pilotage data using a vessel IMO number.
- **Pilotage Data Table**: Displays the **8** latest pilotage data snapshots in a human-readable format with the most recent entry highlighted for clarity.
- **Error Handling**: Handles invalid IMO number and API errors.
- **Time Zone Conversion**: Converts Zulu Time (UTC) to Singapore Time (SGT) for all calculations.
- **Bilingual Support**: Displays status message in both **English** and **Chinese** to cater to truck drivers who may not be fluent in English. (see [Supplementary Information](#supplementary-information))

---

## Assumptions

1. **Journey Time**:
    - The journey from the anchorage to the berth at the port takes **30 minutes**.
    - The entire pilotage service (both arriving and leaving Singapore), from request time to end time, takes around **2 hours**.
    - Using these estimated journey time, we let the truck drivers know the ETA of the vessels
    - For vessels moving between anchors (both `from` and `to` start with "A")
        - From arrival to end: **1 hour 30 minutes**
        - From onboard to end: **1 hour**
        - From start to end: **30 minutes**

2. **Pilotage Service Sequence**:
    - Vessel arrives at the pilot boarding location -> Pilot boards -> Pilotage service starts -> Pilotage service ends.
    - All the time field should follow this order.

3. **Delivery and Loading of Containers**
    - Once the vessel is at the pilot boarding location, no more loading of containers occurs.
    - This means truck drivers would not need to know the exact pilotage status if the vessel is about take off 
    - For example, it does not matter if the Pilot is driving towards the Pilot Boarding Ground or if the vessel has reached the Pilot Boarding Ground (leaving Singapore). In both cases, there is no point delivering containers for loading since no more loading is allowed.

4. **Time Validation**
    - The test data provided are randomly populated and often show timestamps ahead of the current time. In real-life scenarios, snapshot data should occur before the current time to accurately reflect past and ongoing vessel activities.
    - As a result, time validation is not necessary, even though the table may show that a Vessel has left at a time and date in the future

---

## Functional Requirements

### User Interface
- **Search bar**:
    - Initially empty (there is no default value).
    - Accepts only one valid vessel IMO number.
    - Performs IMO validation before proceeding with the request.

- **Pilotage Data Table**:
    - Initially Empty.
    - Displayes the latest pilotage data in a human-redeable format.
    - Columns: IMO, Vessel Name, Status, Time Updated

---

# Status Logic
1. **Vessel Has Reached the Anchorage**:
- All fields (`pilotage_arrival_dt_time`, `pilotage_onboard_dt_time`, `pilotage_start_dt_time`, `pilotage_end_dt_time`) are not null.
- Notify the truck driver that the vessel has arrived at the anchorage and will reach the berth in about **30 minutes**.

2. **Vessel Has Not Reached the Anchorage**:
   - **Case 1**: Vessel is at the pilot boarding ground, and the pilotage service has not started.
     - Notify the truck driver of the estimated arrival time based on the `pilotage_cst_dt_time` (about **2 hours** from the request time).
   - **Case 2**: Pilot has boarded the vessel, but the pilotage service has not started.
     - Notify the truck driver of the estimated arrival time based on the `pilotage_onboard_dt_time` (about **2 hours** from the onboard time).
   - **Case 3**: Pilotage service has started, but the vessel has not reached the anchorage.
     - Notify the truck driver of the estimated arrival time based on the `pilotage_start_dt_time` (about **1.5 hours** from the start time).


#### Vessels Leaving Singapore
1. **Vessel Has Left the Anchorage**:
   - Notify the truck driver that the vessel is leaving Singapore and no more loading/unloading is possible.

2. **Vessel Has Not Left the Anchorage**:
   - Provide an estimated departure time based on the `pilotage_cst_dt_time`.

#### Vessels Moving Between Anchors
1. **Moving Between Anchors** (both `pilotage_loc_from_code` and `pilotage_loc_to_code` start with "A"):
    - **Arrival Stage**: Only `pilotage_arrival_dt_time` is not null.
        - Notify the truck driver that the vessel has arrived at the starting anchorage, with an ETA to the destination anchorage in **1 hour 30 minutes** from arrival time.
    - **Onboard Stage**: `pilotage_arrival_dt_time` and `pilotage_onboard_dt_time` are not null.
        - Notify the truck driver that the pilot has boarded, with an ETA to the destination anchorage in **1 hour** from onboard time.
    - **Start Stage**: `pilotage_arrival_dt_time`, `pilotage_onboard_dt_time`, and `pilotage_start_dt_time` are not null.
        - Notify the truck driver that pilotage has started, with an ETA to the destination anchorage in **30 minutes** from the start time.
    - **End Stage**:  All fields (`pilotage_arrival_dt_time`, `pilotage_onboard_dt_time`, `pilotage_start_dt_time`, `pilotage_end_dt_time`) are not null.
        - Notify the truck driver that the vessel has arrived at the destination anchorage and will reach the berth in about **30 minutes**.

---

## Technical Details

### Technologies Used
- **Frontend**: React with Typescript.
- **Styling**: CSS for table and layout styling.
- **API**: Axios for fetching pilotage data from the provided endpoint.

### Key Components
1. **SearchBar.tsx**: Handles the search input and validation.
2. **PilotageTable.tsx**: Displays the pilotage data in a table format.
3. **ErrorMessage.tsx**: Displays error messages for invalid IMO numbers or API errors.
4. **api.ts**: Handles API requests to fetch pilotage data.

### Time Zone Conversion
- All timestamps are converted from **Zulu Time (UTC)** to **Singapore Time (SGT)** using a utility function.

---

## Setup Instructions

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/IanCheah/sgtradex-take-home-assessment
   cd pilotage-app

2. **Install Dependencies**:
    ```bash
    npm install

3. **Start the Development Server**:
    ```bash
    npm start

4. **Open the Applcation**
    - Visit http://localhost:3000 in your browser

## Supplementary Information
### Vessel Journey in Singapore
- **Arrival**: Begins at the pilot boarding ground and proceeds to an anchorage
- **Departure**: From the anchorage to the pilot boarding ground

### Pilotage Data Location Codes
- **Anchorages**: Location codes starting with `Axxxx`.
- **Pilot Boarding Ground**: Location codes starting with `Pxxxx`.

### Chinese Language Support 
#### Why Include Chinese?
- **Target Audience**: Many truck drivers in Singapore, especially older ones, may not be fluent in English. Providing bilingual support ensures that all users can understand the status updates clearly.
- **User Experience**: By displaying messages in both English and Chinese, we imporve accessibility and usability for a wider audience. This would mean more people using the application we make.
#### Implemntation
- **Static Translation**: Pre-defined bilingual messages are used to ensure consistency and avoid dynamic translation errors.
---