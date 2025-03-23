import React from "react";
import { PilotageData } from "../types/PilotageData";
import "./Table.css";

interface PilotageTableProps {
    data: PilotageData[];
}

const statusMessages = {
    arrivedAtAnchorage: {
        english: (loc: string, time: string) => `Vessel has arrived at anchor (${loc}) at ${time}. Will reach the berth in about 30 minutes.`,
        chinese: (loc: string, time: string) => `船舶已在 ${time} 到达锚地 (${loc}) 。将在约30分钟后到达泊位。`,
    },
    atPilotBoardingGround: {
        english: (locFrom: string, locTo: string, arrivalTime: string, estimatedArrival: string) =>
            `Vessel is at Pilot Boarding Ground (${locFrom}) since ${arrivalTime}. Estimated arrival at anchor (${locTo}) by ${estimatedArrival}.`,
        chinese: (locFrom: string, locTo: string, arrivalTime: string, estimatedArrival: string) =>
            `船舶在引航员登船地点 (${locFrom}) 自 ${arrivalTime}。预计到达锚地 (${locTo}) 在 ${estimatedArrival}。`,
    },
    pilotBoarded: {
        english: (loc: string, onboardTime: string, estimatedArrival: string) =>
            `Pilot has boarded the vessel at ${onboardTime}. Estimated arrival at anchor (${loc}) by ${estimatedArrival}.`,
        chinese: (loc: string, onboardTime: string, estimatedArrival: string) =>
            `引航员已登船在 ${onboardTime}。预计在 ${estimatedArrival}到达锚地 (${loc})。`,
    },
    pilotageStarted: {
        english: (loc: string, startTime: string, estimatedArrival: string) =>
            `Pilotage service started at ${startTime}. Estimated arrival at anchor (${loc}) by ${estimatedArrival}.`,
        chinese: (loc: string, startTime: string, estimatedArrival: string) =>
            `引航服务已在 ${startTime}时开始。预计在 ${estimatedArrival}到达锚地 (${loc})。`,
    },
    leftAnchorage: {
        english: (loc: string, arrivalTime: string) => `Vessel has left the anchor (${loc}) at ${arrivalTime}. No more loading/unloading is possible.`,
        chinese: (loc: string, arrivalTime: string) => `船舶已在 ${arrivalTime}时离开锚地 (${loc})。无法再进行装卸。`,
    },
    atAnchorage: {
        english: (loc: string, departureTime: string) => `Vessel is at anchor (${loc}). Estimated departure at ${departureTime}.`,
        chinese: (loc: string, departureTime: string) => `船舶在锚地 (${loc})。预计在 ${departureTime}离港。`,
    },
    unknownStatus: {
        english: "Unknown status.",
        chinese: "未知状态。",
    },
};

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
const getArrivingStatus = (item: PilotageData): { english: string; chinese: string } => {
    // Case 1: Vessel has reached the anchorage
    if (
        item.pilotage_onboard_dt_time &&
        item.pilotage_arrival_dt_time &&
        item.pilotage_start_dt_time &&
        item.pilotage_end_dt_time
    ) {
        const endTime = formatDateTime(item.pilotage_end_dt_time);
        return {
            english: statusMessages.arrivedAtAnchorage.english(item.pilotage_loc_to_code, endTime),
            chinese: statusMessages.arrivedAtAnchorage.chinese(item.pilotage_loc_to_code, endTime),
        };
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
        return {
            english: statusMessages.atPilotBoardingGround.english(
                item.pilotage_loc_from_code,
                item.pilotage_loc_to_code,
                arrivalTime,
                estimatedArrival
            ),
            chinese: statusMessages.atPilotBoardingGround.chinese(
                item.pilotage_loc_from_code,
                item.pilotage_loc_to_code,
                arrivalTime,
                estimatedArrival
            ),
        };
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
        return {
            english: statusMessages.pilotBoarded.english(item.pilotage_loc_to_code, onboardTime, estimatedArrival),
            chinese: statusMessages.pilotBoarded.chinese(item.pilotage_loc_to_code, onboardTime, estimatedArrival),
        };
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
        const englishMessage = statusMessages.pilotageStarted.english(item.pilotage_loc_to_code, startTime, estimatedArrival);
        const chineseMessage = statusMessages.pilotageStarted.chinese(item.pilotage_loc_to_code, startTime, estimatedArrival);
        return {
            english: statusMessages.pilotageStarted.english(item.pilotage_loc_to_code, startTime, estimatedArrival),
            chinese: statusMessages.pilotageStarted.chinese(item.pilotage_loc_to_code, startTime, estimatedArrival),
        };
    }

    // Default status for arriving vessels
    return statusMessages.unknownStatus;
};

// Logic for vessels leaving Singapore
const getLeavingStatus = (item: PilotageData): { english: string, chinese: string } => {
    // Case 1: Vessel has left the anchor
    if (item.pilotage_arrival_dt_time) {
        const arrivalTime = formatDateTime(item.pilotage_arrival_dt_time);
        return {
            english: statusMessages.leftAnchorage.english(item.pilotage_loc_from_code, arrivalTime),
            chinese: statusMessages.leftAnchorage.chinese(item.pilotage_loc_from_code, arrivalTime),
        };
    }

    // Case 2: Vessel has not left the anchor
    if (
        !item.pilotage_onboard_dt_time &&
        !item.pilotage_arrival_dt_time &&
        !item.pilotage_start_dt_time &&
        !item.pilotage_end_dt_time
    ) {
        const departureTime = formatDateTime(item.pilotage_cst_dt_time);
        const englishMessage = statusMessages.atAnchorage.english(item.pilotage_loc_from_code, departureTime);
        const chineseMessage = statusMessages.atAnchorage.chinese(item.pilotage_loc_from_code, departureTime);
        return {
            english: statusMessages.atAnchorage.english(item.pilotage_loc_from_code, departureTime),
            chinese: statusMessages.atAnchorage.chinese(item.pilotage_loc_from_code, departureTime),
        };
    }

    // Default status for leaving vessels
    return statusMessages.unknownStatus;
};

const getVesselStatus = (item: PilotageData): { english: string; chinese: string } => {
    const isArrivingSingapore: boolean =
        item.pilotage_loc_to_code.startsWith("A") && item.pilotage_loc_from_code.startsWith("P");

    const isLeavingSingapore: boolean =
        item.pilotage_loc_to_code.startsWith("P") && item.pilotage_loc_from_code.startsWith("A");

    if (isArrivingSingapore) {
        return getArrivingStatus(item);
    } else if (isLeavingSingapore) {
        return getLeavingStatus(item);
    }

    return statusMessages.unknownStatus;
};

const PilotageTable: React.FC<PilotageTableProps> = ({ data }) => {
    const latestData: PilotageData[] = getLatestSnapshot(data);
    // console.log("Table.tsx latestData is", latestData);

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
                {latestData.map((item, index) => {
                    const status = getVesselStatus(item);
                    return (
                        <tr key={index}>
                            <td>{item.pilotage_imo}</td>
                            <td>{item.pilotage_nm}</td>
                            <td>
                                {status.english}
                                <br />
                                {status.chinese}
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
};

export default PilotageTable;