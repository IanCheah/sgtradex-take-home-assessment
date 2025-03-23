import React from "react";
import { PilotageData } from "../types/PilotageData";
import "./Table.css";

interface PilotageTableProps {
    data: PilotageData[];
}

const convertToSingaporeTime = (dateString: string | null): Date | null => {
    if (!dateString) return null;
    const date = new Date(dateString.trim());
    return new Date(date.getTime() + 8 * 60 * 60 * 1000);
};

const formatDateTime = (dateString: string | null): string => {
    const date = convertToSingaporeTime(dateString);
    if (!date) return 'N/A';
    return date.toLocaleString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Singapore',
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
    return Array.from(vesselMap.values());
};

// Logic for vessels arriving in Singapore
const getArrivingStatus = (item: PilotageData): string => {
    // Case 1: Vessel has reached the anchorage
    if (
        item.pilotage_onboard_dt_time &&
        item.pilotage_arrival_dt_time &&
        item.pilotage_start_dt_time &&
        item.pilotage_end_dt_time
    ) {
        const endTime = formatDateTime(item.pilotage_end_dt_time);
        return `Vessel has arrived at anchor (${item.pilotage_loc_to_code}) at ${endTime}. Will reach the berth in about 30 minutes.`;
    }

    // Case 2: Vessel has not reached the anchorage
    // Case 2a: Vessel is at Pilot Boarding Ground, pilotage service has not started
    if (
        !item.pilotage_onboard_dt_time &&
        !item.pilotage_start_dt_time &&
        !item.pilotage_end_dt_time &&
        item.pilotage_arrival_dt_time
    ) {
        const arrivalTime = formatDateTime(item.pilotage_arrival_dt_time);
        const estimatedArrival = formatDateTime(
            new Date(new Date(item.pilotage_cst_dt_time).getTime() + 2 * 60 * 60 * 1000).toISOString()
        );
        return `Vessel is at Pilot Boarding Ground (${item.pilotage_loc_from_code}) since ${arrivalTime}. Estimated arrival at anchor (${item.pilotage_loc_to_code}) by ${estimatedArrival}.`;
    }

    // Case 2b: Pilot has boarded the vessel, but pilotage service has not started
    if (
        item.pilotage_onboard_dt_time &&
        item.pilotage_arrival_dt_time &&
        !item.pilotage_start_dt_time &&
        !item.pilotage_end_dt_time
    ) {
        const onboardTime = formatDateTime(item.pilotage_onboard_dt_time);
        const estimatedArrival = formatDateTime(
            new Date(new Date(item.pilotage_onboard_dt_time).getTime() + 2 * 60 * 60 * 1000).toISOString()
        );
        return `Pilot has boarded the vessel at ${onboardTime}. Estimated arrival at anchor (${item.pilotage_loc_to_code}) by ${estimatedArrival}.`;
    }

    // Case 2c: Pilotage service has started, but vessel has not reached anchorage
    if (
        item.pilotage_onboard_dt_time &&
        item.pilotage_arrival_dt_time &&
        item.pilotage_start_dt_time &&
        !item.pilotage_end_dt_time
    ) {
        const startTime = formatDateTime(item.pilotage_start_dt_time);
        const estimatedArrival = formatDateTime(
            new Date(new Date(item.pilotage_start_dt_time).getTime() + 1.5 * 60 * 60 * 1000).toISOString()
        );
        return `Pilotage service started at ${startTime}. Estimated arrival at anchor (${item.pilotage_loc_to_code}) by ${estimatedArrival}.`;
    }

    // Default status for arriving vessels
    return "Unknown status.";
};

// Logic for vessels leaving Singapore
const getLeavingStatus = (item: PilotageData): string => {
    // Case 1: Vessel has left the anchor
    if (item.pilotage_arrival_dt_time) {
        const arrivalTime = formatDateTime(item.pilotage_arrival_dt_time);
        return `Vessel has left the anchor (${item.pilotage_loc_from_code}) at ${arrivalTime}. No more loading/unloading is possible.`;
    }

    // Case 2: Vessel has not left the anchor
    if (
        !item.pilotage_onboard_dt_time &&
        !item.pilotage_arrival_dt_time &&
        !item.pilotage_start_dt_time &&
        !item.pilotage_end_dt_time
    ) {
        const departureTime = formatDateTime(item.pilotage_cst_dt_time);
        return `Vessel is at anchor (${item.pilotage_loc_from_code}). Estimated departure at ${departureTime}.`;
    }

    // Default status for leaving vessels
    return "Unknown status.";
};

const getVesselStatus = (item: PilotageData): string => {
    const isArrivingSingapore: boolean =
        item.pilotage_loc_to_code.startsWith("A") && item.pilotage_loc_from_code.startsWith("P");

    const isLeavingSingapore: boolean =
        item.pilotage_loc_to_code.startsWith("P") && item.pilotage_loc_from_code.startsWith("A");

    if (isArrivingSingapore) {
        return getArrivingStatus(item);
    } else if (isLeavingSingapore) {
        return getLeavingStatus(item);
    }

    return "Unknown status.";
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