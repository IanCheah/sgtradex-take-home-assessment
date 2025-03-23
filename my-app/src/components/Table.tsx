import React from "react";
import { PilotageData } from "../types/PilotageData";
import "./Table.css";

interface PilotageTableProps {
    data: PilotageData[];
}

// Formats the date and time to a more human-readable format
const formatDateTime = (dateString: string | null) => {
    if (!dateString) {
        return 'N/A';
    }
    const date = new Date(dateString.trim());
    return date.toLocaleString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

// Only obtains the latest snapshot for each vessel
const getLatestSnapshot = (data: PilotageData[]): PilotageData[] => {
    const vesselMap = new Map<string, PilotageData>();

    data.forEach((item) => {
        const existingItem: PilotageData | undefined = vesselMap.get(item.pilotage_imo);
        if (!existingItem || new Date(item.pilotage_snapshot_dt) > new Date(existingItem.pilotage_snapshot_dt)) {
            vesselMap.set(item.pilotage_imo, item);
        }
    });
    return Array.from(vesselMap.values())
}

// Logic for vessels arriving in Singapore
const getArrivingStatus = (item: PilotageData, currentTime: Date): string => {
    // Case 1: Vessel is at anchor
    if (item.pilotage_end_dt_time) {
      const endTime = formatDateTime(item.pilotage_end_dt_time);
      return `Has arrived at anchor (${item.pilotage_loc_to_code}) at ${endTime}, reaching port within 30mins.`;
    }
  
    // Case 2: Vessel is not at anchor
    const requestTime = new Date(item.pilotage_cst_dt_time);
    const timeDiff = (requestTime.getTime() - currentTime.getTime()) / (1000 * 60 * 60);
  
    // Case 2a: Pilotage request is more than 1 day later
    if (timeDiff > 24) {
      const arrivalStart = formatDateTime(new Date(requestTime.getTime() + 60 * 60 * 1000).toISOString());
      const arrivalEnd = formatDateTime(new Date(requestTime.getTime() + 2 * 60 * 60 * 1000).toISOString());
      return `Vessel is estimated to arrive between ${arrivalStart} and ${arrivalEnd}.`;
    }
  
    // Case 2b: Vessel has arrived but not started
    if (item.pilotage_arrival_dt_time && !item.pilotage_start_dt_time && !item.pilotage_onboard_dt_time) {
      const arrivalTime = formatDateTime(item.pilotage_arrival_dt_time);
      return `${item.pilotage_nm} has arrived at ${item.pilotage_loc_to_code} at ${arrivalTime}.`;
    }
  
    // Case 2c: Pilot has onboarded but not started
    if (item.pilotage_arrival_dt_time && item.pilotage_onboard_dt_time && !item.pilotage_start_dt_time) {
      const onboardTime = formatDateTime(item.pilotage_onboard_dt_time);
      return `Pilot has onboarded ${item.pilotage_nm} at ${onboardTime}. Estimated arrival in about 1 hour.`;
    }
  
    // Case 2d: Pilot is driving the vessel
    if (item.pilotage_arrival_dt_time && item.pilotage_onboard_dt_time && item.pilotage_start_dt_time) {
      return `Pilot is driving ${item.pilotage_nm} to ${item.pilotage_loc_to_code}, will arrive in 30 minutes.`;
    }
  
    // Default status for arriving vessels
    return "Status unknown.";
  };

  // Logic for vessels leaving Singapore
const getLeavingStatus = (item: PilotageData): string => {
    // Case 1: Pilotage has ended
    if (item.pilotage_end_dt_time) {
      const endTime = formatDateTime(item.pilotage_end_dt_time);
      return `${item.pilotage_nm} has left Singapore.`;
    }
  
    // Case 2: Pilotage has not ended
    // Case 2a: onboard, arrival, start are all null
    // The vessel is stil at anchor
    if (!item.pilotage_onboard_dt_time && !item.pilotage_arrival_dt_time && !item.pilotage_start_dt_time
    ) {
      const departureTime = formatDateTime(item.pilotage_cst_dt_time);
      return `${item.pilotage_nm} is at anchor (${item.pilotage_loc_from_code}). Estimated departure at ${departureTime}.`;
    }
  
    // Case 2b: onboard not null, arrival and start are null
    // Pilot boarded, but have not left
    if (
      item.pilotage_onboard_dt_time && !item.pilotage_arrival_dt_time && !item.pilotage_start_dt_time
    ) {
      const onboardTime = formatDateTime(item.pilotage_onboard_dt_time);
      return `Pilot is about to drive ${item.pilotage_nm} off. Onboard time: ${onboardTime}.`;
    }
  
    // Case 2c: onboard and start not null, arrival is null
    // Pilot is driving from Anchorage to Pilot Boarding Ground
    if (
      item.pilotage_onboard_dt_time && item.pilotage_start_dt_time && !item.pilotage_arrival_dt_time
    ) {
      return `Pilot is driving ${item.pilotage_nm} to ${item.pilotage_loc_to_code}.`;
    }
  
    // Case 2d: onboard, start, and arrival are all not null
    // Arrived at the Pilot Boarding Ground
    if (
      item.pilotage_onboard_dt_time && item.pilotage_start_dt_time && item.pilotage_arrival_dt_time
    ) {
      const arrivalTime = formatDateTime(item.pilotage_arrival_dt_time);
      return `${item.pilotage_nm} arrived at ${item.pilotage_loc_to_code} at ${arrivalTime}.`;
    }
  
    // Default status for leaving vessels
    return "Status unknown.";
  };

  // Main function to determine vessel status
const getVesselStatus = (item: PilotageData): string => {
    const currentTime = new Date();
  
    const isArrivingSingapore: boolean =
      item.pilotage_loc_to_code.startsWith("A") && item.pilotage_loc_from_code.startsWith("P");
  
    const isLeavingSingapore: boolean =
      item.pilotage_loc_to_code.startsWith("P") && item.pilotage_loc_from_code.startsWith("A");
  
    if (isArrivingSingapore) {
      return getArrivingStatus(item, currentTime);
    } else if (isLeavingSingapore) {
      return getLeavingStatus(item);
    }
  
    // Default status
    return "Status unknown.";
  };
  
  
const PilotageTable: React.FC<PilotageTableProps> = ({ data }) => {
const latestData: PilotageData[] = getLatestSnapshot(data);
console.log("Table.tsx latestData is", latestData);

return (
    <table className="pilotage-table">
    <thead>
        <tr>
        <th>IMO</th>
        <th>Vessel Name</th>
        <th>Status</th>
        </tr>
    </thead>
    <tbody>
        {latestData.map((item, index) => (
        <tr key={index}>
            <td>{item.pilotage_imo}</td>
            <td>{item.pilotage_nm}</td>
            <td>{getVesselStatus(item)}</td>
        </tr>
        ))}
    </tbody>
    </table>
);
};

export default PilotageTable;
